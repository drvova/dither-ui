// Build-time prerender: snapshots /, /docs, and /studio into dist as static
// HTML so non-JS crawlers (Bing, DuckDuckGo, social fetchers) read the real
// page DOM from bytes instead of an empty #app shell. Canvas pixels never
// serialize — text, headings, props tables, and code do, which is what
// search needs. The module scripts stay in the snapshot, so browsers
// re-mount the interactive app on top. Runs as the last step of `npm run build`.
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright-core"
import { RISE_WAIT } from "../src/shared/lib/rise-wait.ts"
import { findChromium, listen, refineEmbed, renderOgCards, writeAgentRegistry } from "./cards.ts"

const DIST = fileURLToPath(new URL("../dist", import.meta.url))
// Each route waits for its own mount signal: the landing's h1, the docs'
// full section IA (>200 sections = chunk mounted), or the studio's toolbar
// home link (unconditional once the studio chunk mounts).
const ROUTES = [
  { path: "/", entry: "index.html", ready: "h1", settle: 1000 },
  { path: "/docs", entry: "docs/index.html", minSections: 200, settle: 2000 },
  { path: "/studio", entry: "studio/index.html", ready: "[data-artboard-surface]", settle: 1000 },
]
// The entry HTML owns the static head; the runtime meta watcher mutates it
// (title/canonical/description/breadcrumb per active section). Reset to the
// entry's own values before serializing so non-JS readers see the generic
// /docs metadata — the JS renderer re-derives per-section values anyway.
function extractStaticMeta(html) {
  return {
    title: html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "",
    canonical: html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? "",
    description: html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "",
  }
}

const server = await listen(DIST)
const origin = server.origin
const browser = await chromium.launch({ executablePath: findChromium() })

/* ---------------- SEO engine: og cards + per-section docs pages ---------- */

// One prerendered docs DOM serves every section: clone the entry, swap in
// each section's head (title/description/canonical/og/twitter/breadcrumb +
// the section's og card), keep only that section in the docs flow (the
// docs' front, its title block and intro, `data-docs-front`, leaves; the
// section loses the `hidden` the front's page gave it), its own breadcrumb,
// the sidebar with every group open and none current (a static page cannot
// know the reader's folds; the client sets them on mount), and no pager
// (the client renders the section's own below the fold). A page is
// the shell plus its own section, not 302 copies of the whole docs (1.3 MB
// each); the client mounts the docs over these bytes on that section. An id
// that is not a direct child of the flow keeps the whole flow.
async function writeSectionPages(flow) {
  let sections
  try {
    sections = JSON.parse(await readFile(join(DIST, "og", "sections.json"), "utf8"))
  } catch {
    console.log("sections: no manifest — skipping per-section pages")
    return
  }
  const entry = await readFile(join(DIST, "docs", "index.html"), "utf8")
  // The source head's STATIC assets (module scripts, stylesheets, icons) are
  // what the section page reuses; every meta/title/canonical/ld line is
  // stripped first so the section's own block can be injected exactly once —
  // stripping after injection would self-clobber (the injected block matches
  // the same patterns and sits earlier in document order).
  const noLd = entry.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "")
  const headMatch = noLd.match(/<head>[\s\S]*?<\/head>/)
  if (!headMatch) {
    console.log("sections: docs head not found — skipping per-section pages")
    return
  }
  const at = flow ? noLd.indexOf(flow.inner) : -1
  if (flow && at < 0) console.log("sections: docs flow not found in the snapshot — pages keep the whole flow")
  const headLines = headMatch[0]
    .split("\n")
    .filter(
      (l) =>
        !/<title>|name="description"|name="twitter:|property="og:|rel="canonical"|rel="discord:component-embed"|application\/json\+oembed/.test(
          l,
        ),
    )
  const strippedHead = headLines.join("\n")
  let written = 0
  for (const s of sections) {
    // The section's own head (meta, its share card's tags, its breadcrumb),
    // composed by the manifest from seo.ts.
    const headBlock = `\n    ${s.head}`
    const own = at >= 0 && flow.kids.some((k) => k.id === s.id)
    const body = own
      ? noLd.slice(0, at) +
        flow.kids
          .filter((k) => (k.id ? k.id === s.id : !k.front))
          .map((k) => k.html)
          .join("") +
        noLd.slice(at + flow.inner.length)
      : noLd
    const located = own && flow.crumb && flow.rail
    const page = located
      ? body
          .replace(flow.crumb.outer, () => flow.crumb.per[s.id] ?? "")
          .replace(flow.rail.outer, () => flow.rail.open)
          .replace(flow.pager ?? "\u0000", () => "")
      : body
    const html = page.replace(headMatch[0], () => strippedHead.replace("<head>", () => "<head>" + headBlock))
    const dir = join(DIST, "docs", s.id)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, "index.html"), html)
    written++
    await refineEmbed(DIST, s, flow?.kids.find((k) => k.id === s.id)?.lede ?? "")
  }
  console.log(`sections: wrote ${written} per-section docs pages -> dist/docs/<id>/index.html`)
}

let docsFlow = null
try {
  const page = await browser.newPage()
  for (const route of ROUTES) {
    const entry = join(DIST, route.entry)
    const meta = extractStaticMeta(await readFile(entry, "utf8"))
    // The docs mount a pack of sections only once it is opened; the
    // snapshot asks for every one (ALL_SECTIONS_PARAM in docs/packs.ts).
    const query = route.minSections ? "?all-sections" : ""
    await page.goto(`${origin}${route.path}${query}`, { waitUntil: "networkidle" })
    if (route.minSections) {
      // The docs chunk is async; wait until the full section IA is mounted,
      // then let canvas-driven layout settle before serializing.
      await page.waitForFunction((n) => document.querySelectorAll("section[id]").length > n, route.minSections, {
        timeout: 60_000,
      })
    } else {
      await page.waitForSelector(route.ready, { timeout: 30_000 })
    }
    await page.waitForTimeout(route.settle)
    await page.evaluate(
      ([m, riseWait]) => {
        document.title = m.title
        document.querySelector('link[rel="canonical"]')?.setAttribute("href", m.canonical)
        document.querySelector('meta[name="description"]')?.setAttribute("content", m.description)
        document.querySelector("#docs-breadcrumb")?.remove()
        // The agent protocol's document mirror is runtime state, not content.
        document.querySelector("#dither-studio-document")?.remove()
        // Entrance latches are runtime state: a snapshot taken after a figure
        // played would ship it finished, and the client — which renders fresh
        // over these bytes — would flash the end state, hide it, and replay.
        for (const el of document.querySelectorAll("[data-live]")) {
          el.removeAttribute("data-live")
          el.removeAttribute("data-done")
        }
        // So is the rise: the bytes wait for it again (src/shared/lib/rise.ts).
        document.documentElement.classList.remove(riseWait)
        document.documentElement.removeAttribute("data-rise")
        for (const el of document.querySelectorAll("[data-rise]")) {
          el.removeAttribute("data-risen")
          el.style.removeProperty("opacity")
          if (!el.getAttribute("style")) el.removeAttribute("style")
        }
      },
      [meta, RISE_WAIT],
    )
    if (route.minSections)
      docsFlow = await page.evaluate(() => {
        const flow = document.querySelector(".docs-flow")
        if (!flow) return null
        // A section's lede is its first paragraph (the anatomy's muted line);
        // its copy loses the `hidden` the front's page gave it.
        const kids = [...flow.children].map((c) => {
          const copy = c.cloneNode(true)
          copy.removeAttribute("hidden")
          return {
            id: c.tagName === "SECTION" ? c.id : "",
            front: c.hasAttribute("data-docs-front"),
            html: copy.outerHTML,
            lede: c.querySelector("p")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
          }
        })
        // Each section's breadcrumb (the docs, then its group, linking to
        // the group's first section), read off the rail's own groups, and
        // the rail with every group open and no link current.
        const crumb = document.querySelector('nav[aria-label="Breadcrumb"]')
        const rail = document.querySelector('nav[aria-label="Docs sections"]')
        let crumbs = null
        let railOpen = null
        if (crumb && rail) {
          const per = {}
          for (const list of rail.querySelectorAll("ul[id]")) {
            // The family's name, as its heading carries it (DocsNav's data-group).
            const title = list.previousElementSibling?.getAttribute("data-group")
            const links = [...list.querySelectorAll(":scope > li > a")]
            const first = links[0]?.getAttribute("href")
            for (const a of links) {
              const id = a
                .getAttribute("href")
                .replace(/.*\/docs\//, "")
                .replace(/\/$/, "")
              const copy = crumb.cloneNode(true)
              const group = copy.querySelectorAll("a")[1]
              if (group && title && first) {
                group.textContent = title
                group.setAttribute("href", first)
                group.removeAttribute("aria-current")
              }
              per[id] = copy.outerHTML
            }
          }
          const open = rail.cloneNode(true)
          for (const list of open.querySelectorAll("ul[id]")) list.removeAttribute("style")
          for (const head of open.querySelectorAll("button[aria-expanded]")) head.setAttribute("aria-expanded", "true")
          for (const a of open.querySelectorAll("[aria-current]")) a.removeAttribute("aria-current")
          crumbs = { outer: crumb.outerHTML, per }
          railOpen = { outer: rail.outerHTML, open: open.outerHTML }
        }
        // The pager names the front's neighbours: a section's static page
        // leaves it to the client, which renders its own on mount.
        const pager = document.querySelector('nav[aria-label="Previous and next sections"]')?.outerHTML ?? null
        return { inner: flow.innerHTML, kids, crumb: crumbs, rail: railOpen, pager }
      })
    const html = await page.content()
    await writeFile(entry, html)
    console.log(`prerendered ${route.path} -> dist/${route.entry} (${(html.length / 1024).toFixed(0)} kB)`)
    if (route.path === "/studio") {
      // The agent registry is the studio's own schema, read off the mounted
      // app so it can never drift from the registry the inspector renders.
      const components = await writeAgentRegistry(page, DIST)
      if (components) console.log(`agent: wrote ${components} components -> dist/agent/registry.json`)
    }
  }
  // The SEO engine's two phases, on the same browser: the per-section og
  // cards first (the section pages reference them), then the pages.
  // Each section's lede (its first paragraph in the docs snapshot), which
  // its card sets under its title as its embed does.
  const ledes = Object.fromEntries((docsFlow?.kids ?? []).filter((k) => k.id && k.lede).map((k) => [k.id, k.lede]))
  await renderOgCards({ browser, origin, dist: DIST, ledes })
  await writeSectionPages(docsFlow)
} finally {
  await browser.close()
  server.close()
}
