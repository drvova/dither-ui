// What a build does in a browser once its pages stand: every share card
// drawn by the build's own renderer page (og/index.html, src/pages/docs/
// og-page.ts), each section's Discord embed saying its own lede, and the
// Studio's agent registry read off the mounted app. One copy for both
// builds: scripts/prerender.mjs (the Vue site's dist) and
// solid-site/scripts/postbuild.mjs (the Solid site's .output/public).
// Loaded by Node as it is (type stripping): erasable syntax only.
import { createHash } from "node:crypto"
import { createReadStream, existsSync } from "node:fs"
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises"
import { createServer, type Server } from "node:http"
import { extname, join, normalize } from "node:path"

/** The little of a Playwright page this file drives. */
export interface CardPage {
  goto(url: string, options?: { waitUntil?: "load" | "networkidle" }): Promise<unknown>
  waitForFunction(fn: () => unknown, arg?: undefined, options?: { timeout?: number }): Promise<unknown>
  waitForSelector(selector: string, options?: { timeout?: number }): Promise<unknown>
  evaluate<T, A>(fn: (arg: A) => T | Promise<T>, arg?: A): Promise<T>
  title(): Promise<string>
  close(): Promise<void>
}

/** The little of a Playwright browser this file drives. */
export interface CardBrowser {
  newPage(options?: { viewport?: { width: number; height: number } }): Promise<CardPage>
}

/** A section as the manifest (og/sections.json) names it, as far as the
 * embeds read it. */
export interface CardSection {
  id: string
  description: string
}

export const MIME: Record<string, string> = {
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

/** The Chromium a build draws with: `CHROME_PATH`, else a standard install.
 * A build with none fails here rather than ship without its cards. */
export function findChromium(
  env: Record<string, string | undefined> = process.env,
  exists: (path: string) => boolean = existsSync,
): string {
  const programFiles = env["ProgramFiles"] ?? "C:\\Program Files"
  const programFilesX86 = env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)"
  const localAppData = env.LOCALAPPDATA ?? ""
  const candidates = [
    env.CHROME_PATH,
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
  ].filter((p): p is string => Boolean(p))
  const found = candidates.find((p) => exists(p))
  if (!found)
    throw new Error("prerender: no chromium found. Set CHROME_PATH or install one of: google-chrome, chromium.")
  return found
}

/** The file under `dir` an address names (a folder is its index.html), with
 * the deploy's `base` taken off its front; null for an address outside it. */
export function servedFile(dir: string, url: string, base = "/"): string | null {
  let path = decodeURIComponent(new URL(url, "http://x").pathname)
  if (base !== "/") {
    if (!path.startsWith(base)) return null
    path = path.slice(base.length)
  }
  return join(dir, normalize(path).replace(/^([/\\]|\.\.(?=[/\\]|$))+/, "") || "index.html")
}

/** A minimal static server over a build's output. */
export function serveStatic(dir: string, base = "/"): Server {
  return createServer(async (req, res) => {
    try {
      let file = servedFile(dir, req.url ?? "/", base)
      if (!file) throw new Error("outside the base")
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

/** A build's output served on a free local port: its origin and how to stop. */
export async function listen(dir: string, base = "/"): Promise<{ origin: string; close: () => void }> {
  const server = serveStatic(dir, base)
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r))
  const address = server.address()
  if (!address || typeof address === "string") throw new Error("prerender: the static server has no port")
  return { origin: `http://127.0.0.1:${address.port}`, close: () => server.close() }
}

/** What a section's embed says: its lede, cut at a sentence within ~280
 * characters (a first sentence longer than that stays whole). */
export function embedLine(lede: string): string {
  const sentences = lede.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [lede]
  let said = ""
  for (const sentence of sentences) {
    if (said && (said + sentence).length > 280) break
    said += sentence
  }
  return said.trim()
}

/** A section's Discord embed with its lede in place of the generic meta
 * description it was built with; null when there is nothing to say, the
 * embed does not carry that description, or the result passes the embed's
 * 3,000 byte cap. */
export function refinedEmbed(json: string, section: CardSection, lede: string): string | null {
  if (!lede) return null
  const embed = JSON.parse(json)
  const text = embed?.component?.components?.[0]
  if (!text?.content?.includes(section.description)) return null
  text.content = text.content.replace(section.description, () => embedLine(lede))
  const out = JSON.stringify(embed)
  return Buffer.byteLength(out) <= 3000 ? out : null
}

/** Rewrites `dist/embed/<id>.json` to say the section's lede. */
export async function refineEmbed(dist: string, section: CardSection, lede: string): Promise<boolean> {
  const path = join(dist, "embed", `${section.id}.json`)
  const json = await readFile(path, "utf8").catch(() => "null")
  const out = refinedEmbed(json, section, lede)
  if (out) await writeFile(path, out)
  return out !== null
}

/** The marker that says the cards on disk were drawn from this renderer,
 * manifest and ledes. */
export function cardsHash(renderer: Uint8Array, manifest: Uint8Array, ledes: Record<string, string>): string {
  return createHash("sha256").update(renderer).update(manifest).update(JSON.stringify(ledes)).digest("hex").slice(0, 16)
}

interface OgWindow {
  og: { ids(): string[]; files(id: string): Promise<{ png: string; gif: string }> }
}

/** Every share card (the three routes, then each docs section) drawn by the
 * build's own renderer page (`<dist>/og/index.html`): its still as
 * og/<id>.png and its loop as og/<id>.gif, which the pages' og tags, Discord
 * component embeds and oEmbed photos point at. A few pages draw at once
 * (encoding is CPU-bound, one card about a second). `ledes` is each
 * section's first paragraph, which its card sets under its title. A card
 * that fails rejects, and the build with it. Answers the number drawn (0:
 * no renderer, or the cards on disk are current). */
export async function renderOgCards(opts: {
  browser: CardBrowser
  /** Where `dist` is served, the deploy's base included, no slash at its end. */
  origin: string
  dist: string
  ledes: Record<string, string>
  log?: (line: string) => void
}): Promise<number> {
  const { browser, origin, dist, ledes, log = console.log } = opts
  const renderer = join(dist, "og", "index.html")
  if (!existsSync(renderer)) {
    log("og: no renderer page — skipping cards (the build's og/index entry makes it)")
    return 0
  }
  await writeFile(join(dist, "og", "ledes.json"), JSON.stringify(ledes))
  // A marker skips the render when neither the renderer, the manifest nor
  // the ledes changed and the cards are still there (a run on its own).
  const hash = cardsHash(await readFile(renderer), await readFile(join(dist, "og", "sections.json")), ledes)
  const marker = join(dist, "og", ".cards-hash")
  const prev = await readFile(marker, "utf8").catch(() => "")
  if (prev.trim() === hash && existsSync(join(dist, "og", "home.gif"))) {
    log("og: renderer and manifest unchanged — cards cached, skipping render")
    return 0
  }
  const open = async () => {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
    await page.goto(`${origin}/og/index.html`, { waitUntil: "load" })
    await page.waitForFunction(() => document.title !== "og-loading", undefined, { timeout: 15_000 })
    if ((await page.title()) !== "og-ready") throw new Error("og: the renderer failed to load its cards")
    return page
  }
  const first = await open()
  const queue = await first.evaluate(() => (window as unknown as OgWindow).og.ids())
  const total = queue.length
  let done = 0
  let bytes = 0
  const started = Date.now()
  const work = async (page: CardPage) => {
    for (let id = queue.shift(); id; id = queue.shift()) {
      const files = await page.evaluate((id: string) => (window as unknown as OgWindow).og.files(id), id)
      const png = Buffer.from(files.png, "base64")
      const gif = Buffer.from(files.gif, "base64")
      if (!png.length || !gif.length) throw new Error(`og: the card ${id} came out empty`)
      await writeFile(join(dist, "og", `${id}.png`), png)
      await writeFile(join(dist, "og", `${id}.gif`), gif)
      bytes += png.length + gif.length
      done++
    }
    await page.close()
  }
  const pages = [first, ...(await Promise.all([1, 2, 3].map(open)))]
  await Promise.all(pages.map(work))
  await writeFile(marker, hash)
  const seconds = ((Date.now() - started) / 1000).toFixed(0)
  log(`og: drew ${done}/${total} share cards -> og/<id>.png + .gif (${(bytes / 1048576).toFixed(1)} MB, ${seconds}s)`)
  return done
}

interface StudioWindow {
  ditherStudio?: { registry(): { components: unknown[] } }
}

/** The agent registry, the Studio's own schema read off the mounted app (a
 * page already on the Studio) so it can never drift from the registry the
 * inspector renders, written as `<dist>/agent/registry.json`. Answers the
 * number of components, 0 when the page exposes no Studio. */
export async function writeAgentRegistry(page: CardPage, dist: string): Promise<number> {
  const registry = await page.evaluate(() => (window as unknown as StudioWindow).ditherStudio?.registry() ?? null)
  if (!registry) return 0
  await mkdir(join(dist, "agent"), { recursive: true })
  await writeFile(join(dist, "agent", "registry.json"), JSON.stringify(registry, null, 2))
  return registry.components.length
}
