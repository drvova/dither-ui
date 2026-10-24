// Build-time prerender: snapshots /, /docs, and /studio into dist as static
// HTML so non-JS crawlers (Bing, DuckDuckGo, social fetchers) read the real
// page DOM from bytes instead of an empty #app shell. Canvas pixels never
// serialize — text, headings, props tables, and code do, which is what
// search needs. The module scripts stay in the snapshot, so browsers
// re-mount the interactive app on top. Runs as the last step of `npm run build`.
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises"
import { createReadStream, existsSync } from "node:fs"
import { createServer } from "node:http"
import { extname, join, normalize } from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright-core"

const DIST = fileURLToPath(new URL("../dist", import.meta.url))
// Each route waits for its own mount signal: the landing's h1, the docs'
// full section IA (>200 sections = chunk mounted), or the studio's toolbar
// home link (unconditional once the studio chunk mounts).
const ROUTES = [
  { path: "/", entry: "index.html", ready: "h1", settle: 1000 },
  { path: "/docs", entry: "docs/index.html", minSections: 200, settle: 2000 },
  { path: "/studio", entry: "studio/index.html", ready: 'a[aria-label="dither-ui home"]', settle: 1000 },
]
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".xml": "application/xml",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
}

function findChromium() {
  const programFiles = process.env["ProgramFiles"] ?? "C:\\Program Files"
  const programFilesX86 = process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)"
  const localAppData = process.env.LOCALAPPDATA ?? ""
  const candidates = [
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    // Windows install paths (chrome stable, then Edge — both are chromium)
    `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
    `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
    localAppData ? `${localAppData}\\Google\\Chrome\\Application\\chrome.exe` : "",
    `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ].filter(Boolean)
  const found = candidates.find((p) => existsSync(p))
  if (!found)
    throw new Error("prerender: no chromium found. Set CHROME_PATH or install one of: google-chrome, chromium.")
  return found
}

// Minimal static server for the two routes and their assets.
function serve() {
  return createServer(async (req, res) => {
    try {
      const path =
        normalize(decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname)).replace(/^[/\\]+/, "") ||
        "index.html"
      let file = join(DIST, path)
      const st = await stat(file).catch(() => null)
      if (st?.isDirectory()) file = join(file, "index.html")
      await access(file)
      res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" })
      createReadStream(file).pipe(res)
    } catch {
      res.writeHead(404)
      res.end("not found")
    }
  })
}

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

const server = serve()
await new Promise((r) => server.listen(0, "127.0.0.1", r))
const port = server.address().port
const browser = await chromium.launch({ executablePath: findChromium() })

/* ---------------- SEO engine: og cards + per-section docs pages ---------- */

// Every share card (the three routes, then each docs section) drawn by the
// build's own renderer page (dist/og/index.html, from crawler-files.ts):
// its still as og/<id>.png and its loop as og/<id>.gif, which the pages'
// og tags, Discord component embeds and oEmbed photos point at. A few pages
// draw at once (encoding is CPU-bound, one card about a second).
async function renderOgCards() {
  const renderer = join(DIST, "og", "index.html")
  if (!existsSync(renderer)) {
    console.log("og: no renderer page — skipping cards (the crawler plugin emits it)")
    return
  }
  // A marker skips the render when neither the renderer nor the manifest
  // changed and the cards are still there (a prerender run on its own).
  const { createHash } = await import("node:crypto")
  const hash = createHash("sha256")
    .update(await readFile(renderer))
    .update(await readFile(join(DIST, "og", "sections.json")))
    .digest("hex")
    .slice(0, 16)
  const marker = join(DIST, "og", ".cards-hash")
  const prev = await readFile(marker, "utf8").catch(() => "")
  if (prev.trim() === hash && existsSync(join(DIST, "og", "home.gif"))) {
    console.log("og: renderer and manifest unchanged — cards cached, skipping render")
    return
  }
  const open = async () => {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
    await page.goto(`http://127.0.0.1:${port}/og/index.html`, { waitUntil: "load" })
    await page.waitForFunction(() => document.title !== "og-loading", undefined, { timeout: 15_000 })
    if ((await page.title()) !== "og-ready") throw new Error("og: the renderer failed to load its cards")
    return page
  }
  const first = await open()
  const queue = await first.evaluate(() => window.og.ids())
  const total = queue.length
  let done = 0
  let bytes = 0
  const started = Date.now()
  const work = async (page) => {
    for (let id = queue.shift(); id; id = queue.shift()) {
      const files = await page.evaluate((id) => window.og.files(id), id)
      const png = Buffer.from(files.png, "base64")
      const gif = Buffer.from(files.gif, "base64")
      await writeFile(join(DIST, "og", `${id}.png`), png)
      await writeFile(join(DIST, "og", `${id}.gif`), gif)
      bytes += png.length + gif.length
      done++
    }
    await page.close()
  }
  const pages = [first, ...(await Promise.all([1, 2, 3].map(open)))]
  await Promise.all(pages.map(work))
  await writeFile(marker, hash)
  const seconds = ((Date.now() - started) / 1000).toFixed(0)
  console.log(
    `og: drew ${done}/${total} share cards -> dist/og/<id>.png + .gif (${(bytes / 1048576).toFixed(1)} MB, ${seconds}s)`,
  )
}

// One prerendered docs DOM serves every section: clone the entry, swap in
// each section's head (title/description/canonical/og/twitter/breadcrumb +
// the section's og card) and keep only that section in the docs flow (the
// flow's other children, the h1 and the intro, stay; so do the header and
// the sidebar's links). A page is the shell plus its own section, not 302
// copies of the whole docs (1.3 MB each); the client mounts the full docs
// over these bytes and jumps to the section. An id that is not a direct
// child of the flow keeps the whole flow.
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
          .filter((k) => !k.id || k.id === s.id)
          .map((k) => k.html)
          .join("") +
        noLd.slice(at + flow.inner.length)
      : noLd
    const html = body.replace(headMatch[0], () => strippedHead.replace("<head>", () => "<head>" + headBlock))
    const dir = join(DIST, "docs", s.id)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, "index.html"), html)
    written++
    await refineEmbed(s, flow?.kids.find((k) => k.id === s.id)?.lede ?? "")
  }
  console.log(`sections: wrote ${written} per-section docs pages -> dist/docs/<id>/index.html`)
}

// A section's Discord embed says what the section says first (its lede, cut
// at a sentence within ~280 characters) in place of the generic meta
// description it was built with, under the embed's 3,000 byte cap.
async function refineEmbed(section, lede) {
  if (!lede) return
  const path = join(DIST, "embed", `${section.id}.json`)
  const embed = JSON.parse(await readFile(path, "utf8").catch(() => "null"))
  const text = embed?.component?.components?.[0]
  if (!text?.content?.includes(section.description)) return
  const sentences = lede.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [lede]
  let said = ""
  for (const sentence of sentences) {
    if (said && (said + sentence).length > 280) break
    said += sentence
  }
  text.content = text.content.replace(section.description, () => said.trim())
  const json = JSON.stringify(embed)
  if (Buffer.byteLength(json) <= 3000) await writeFile(path, json)
}

let docsFlow = null
try {
  const page = await browser.newPage()
  for (const route of ROUTES) {
    const entry = join(DIST, route.entry)
    const meta = extractStaticMeta(await readFile(entry, "utf8"))
    await page.goto(`http://127.0.0.1:${port}${route.path}`, { waitUntil: "networkidle" })
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
    await page.evaluate((m) => {
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
    }, meta)
    if (route.minSections)
      docsFlow = await page.evaluate(() => {
        const flow = document.querySelector(".docs-flow")
        if (!flow) return null
        // A section's lede is its first paragraph (the anatomy's muted line).
        const kids = [...flow.children].map((c) => ({
          id: c.tagName === "SECTION" ? c.id : "",
          html: c.outerHTML,
          lede: c.querySelector("p")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
        }))
        return { inner: flow.innerHTML, kids }
      })
    const html = await page.content()
    await writeFile(entry, html)
    console.log(`prerendered ${route.path} -> dist/${route.entry} (${(html.length / 1024).toFixed(0)} kB)`)
    if (route.path === "/studio") {
      // The agent registry is the studio's own schema, read off the mounted
      // app so it can never drift from the registry the inspector renders.
      const registry = await page.evaluate(() => window.ditherStudio?.registry() ?? null)
      if (registry) {
        await mkdir(join(DIST, "agent"), { recursive: true })
        await writeFile(join(DIST, "agent", "registry.json"), JSON.stringify(registry, null, 2))
        console.log(`agent: wrote ${registry.components.length} components -> dist/agent/registry.json`)
      }
    }
  }
  // The SEO engine's two phases, on the same browser: the per-section og
  // cards first (the section pages reference them), then the pages.
  await renderOgCards()
  await writeSectionPages(docsFlow)
} finally {
  await browser.close()
  server.close()
}
