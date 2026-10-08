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
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".json": "application/json", ".xml": "application/xml",
  ".woff2": "font/woff2", ".ico": "image/x-icon",
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
      const path = normalize(decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname)).replace(/^[/\\]+/, "") || "index.html"
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

// The og card renderer's data contract, emitted by the crawler plugin.
async function renderOgCards() {
  const manifestPath = join(DIST, "og", "sections.json")
  let sections
  try {
    sections = JSON.parse(await readFile(manifestPath, "utf8"))
  } catch {
    console.log("og: no sections manifest — skipping og cards (crawler plugin emits it)")
    return
  }
  // Card render is the build's long pole (~1s/section); a manifest-hash
  // marker skips it when no label/title/id changed.
  const { createHash } = await import("node:crypto")
  const hash = createHash("sha256").update(JSON.stringify(sections)).digest("hex").slice(0, 16)
  const marker = join(DIST, "og", ".cards-hash")
  if (await access(marker).then(() => true, () => false)) {
    const prev = (await readFile(marker, "utf8")).trim()
    if (prev === hash) {
      console.log(`og: manifest unchanged (${sections.length} cards cached) — skipping render`)
      return
    }
  }
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  let done = 0
  for (const s of sections) {
    await page.goto(`http://127.0.0.1:${port}/og/index.html?id=${encodeURIComponent(s.id)}`, {
      waitUntil: "networkidle",
    })
    try {
      await page.waitForFunction(() => document.title === "og-ready", { timeout: 10_000 })
      await page.waitForTimeout(120)
      await page.screenshot({ path: join(DIST, "og", `${s.id}.png`), clip: { x: 0, y: 0, width: 1200, height: 630 } })
      done++
    } catch (err) {
      console.log(`og: card for "${s.id}" failed (${String(err).slice(0, 80)}) — embed falls back to the site og.png`)
    }
  }
  await page.close()
  await writeFile(marker, hash)
  console.log(`og: rendered ${done}/${sections.length} section cards -> dist/og/*.png`)
}

// One prerendered docs DOM serves every section: clone the entry and swap in
// each section's head (title/description/canonical/og/twitter/breadcrumb +
// the section's og card). The client mounts over these bytes and re-derives
// per-section state, so only the head differs per file.
async function writeSectionPages() {
  let sections
  try {
    sections = JSON.parse(await readFile(join(DIST, "og", "sections.json"), "utf8"))
  } catch {
    console.log("sections: no manifest — skipping per-section pages")
    return
  }
  const entry = await readFile(join(DIST, "docs", "index.html"), "utf8")
  const SITE = "https://dither-ui.com"
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
  const headLines = headMatch[0]
    .split("\n")
    .filter((l) => !/<title>|name="description"|name="twitter:|property="og:|rel="canonical"/.test(l))
  const strippedHead = headLines.join("\n")
  let written = 0
  for (const s of sections) {
    const ogImage = `${SITE}/og/${s.id}.png`
    const esc = (v) => v.replace(/"/g, "&quot;")
    const headBlock =
      `\n    <title>${esc(s.title)}</title>\n` +
      `    <meta name="description" content="${esc(s.description)}" />\n` +
      `    <link rel="canonical" href="${s.url}" />\n` +
      `    <meta property="og:type" content="article" />\n` +
      `    <meta property="og:title" content="${esc(s.title)}" />\n` +
      `    <meta property="og:description" content="${esc(s.description)}" />\n` +
      `    <meta property="og:url" content="${s.url}" />\n` +
      `    <meta property="og:image" content="${ogImage}" />\n` +
      `    <meta property="og:image:width" content="1200" />\n` +
      `    <meta property="og:image:height" content="630" />\n` +
      `    <meta name="twitter:card" content="summary_large_image" />\n` +
      `    <meta name="twitter:title" content="${esc(s.title)}" />\n` +
      `    <meta name="twitter:description" content="${esc(s.description)}" />\n` +
      `    <meta name="twitter:image" content="${ogImage}" />\n` +
      `    <script type="application/ld+json">${s.breadcrumb}</script>`
    const html = noLd.replace(headMatch[0], strippedHead.replace("<head>", "<head>" + headBlock))
    const dir = join(DIST, "docs", s.id)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, "index.html"), html)
    written++
  }
  console.log(`sections: wrote ${written} per-section docs pages -> dist/docs/<id>/index.html`)
}

try {
  const page = await browser.newPage()
  for (const route of ROUTES) {
    const entry = join(DIST, route.entry)
    const meta = extractStaticMeta(await readFile(entry, "utf8"))
    await page.goto(`http://127.0.0.1:${port}${route.path}`, { waitUntil: "networkidle" })
    if (route.minSections) {
      // The docs chunk is async; wait until the full section IA is mounted,
      // then let canvas-driven layout settle before serializing.
      await page.waitForFunction(
        (n) => document.querySelectorAll("section[id]").length > n,
        route.minSections,
        { timeout: 60_000 }
      )
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
  await writeSectionPages()
} finally {
  await browser.close()
  server.close()
}
