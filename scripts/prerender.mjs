// Build-time prerender: snapshots /, /docs, and /studio into dist as static
// HTML so non-JS crawlers (Bing, DuckDuckGo, social fetchers) read the real
// page DOM from bytes instead of an empty #app shell. Canvas pixels never
// serialize — text, headings, props tables, and code do, which is what
// search needs. The module scripts stay in the snapshot, so browsers
// re-mount the interactive app on top. Runs as the last step of `npm run build`.
import { access, readFile, stat, writeFile } from "node:fs/promises"
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
  const candidates = [
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
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
    }, meta)
    const html = await page.content()
    await writeFile(entry, html)
    console.log(`prerendered ${route.path} -> dist/${route.entry} (${(html.length / 1024).toFixed(0)} kB)`)
  }
} finally {
  await browser.close()
  server.close()
}
