// What a build does in a browser once its pages stand: every share card
// drawn by the build's own renderer page (og/index.html, the site's
// src/pages/docs/og-page.ts), each section's Discord embed saying its own
// lede, and the Studio's agent registry read off the mounted app. Run by
// the site's post-build (its build/postbuild.mjs, over .output/public).
// Loaded by Node as it is (type stripping): erasable syntax only.
import { createHash } from "node:crypto"
import { createReadStream, existsSync } from "node:fs"
import { access, copyFile, mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises"
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
interface CardBrowser {
  /** The browser's own version, part of every card's cache key. */
  version?(): string
  newPage(options?: { viewport?: { width: number; height: number } }): Promise<CardPage>
}

/** A section as the manifest (og/sections.json) names it, as far as the
 * embeds read it. */
interface CardSection {
  id: string
  description: string
}

const MIME: Record<string, string> = {
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
function serveStatic(dir: string, base = "/"): Server {
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

/** Rewrites `<dist>/embed/<id>.json` to say the section's lede. */
export async function refineEmbed(dist: string, section: CardSection, lede: string): Promise<boolean> {
  const path = join(dist, "embed", `${section.id}.json`)
  const json = await readFile(path, "utf8").catch(() => "null")
  const out = refinedEmbed(json, section, lede)
  if (out) await writeFile(path, out)
  return out !== null
}

/** What the renderer page answers as `window.og`: the site's, restated
 * (the tasks never import the site), held to it by the site's
 * `tests/site/protocols.spec.ts`. */
export interface OgWindow {
  og: { ids(): string[]; files(id: string): Promise<{ png: string; gif: string }> }
}

/** The renderer as built: `og/index.html` and every file under
 * `og/assets/` (its script, which holds the card code, the kit engine it
 * prints with, the route cards' copy and the kit's counts; its stylesheet;
 * the display face), names and bytes, hashed. */
export async function rendererHash(dist: string): Promise<string> {
  const og = join(dist, "og")
  const assets = await readdir(join(og, "assets"), { recursive: true }).catch(() => [] as string[])
  const hash = createHash("sha256").update(await readFile(join(og, "index.html")))
  for (const name of assets.map(String).sort()) {
    const file = join(og, "assets", name)
    if (!(await stat(file)).isFile()) continue
    hash.update(`\0${name}\0`).update(await readFile(file))
  }
  return hash.digest("hex")
}

/** Bumped when what a key covers changes, so no older entry answers. */
const CARD_CACHE_VERSION = 1

/** One card's cache key: the renderer's hash, the browser that draws it
 * (its version and the first frame it painted, which changes with any face
 * it falls back to), and the card's own data (its entry in the section
 * manifest, none for a route, whose copy the renderer holds, and its lede).
 * Everything a card is drawn from is in one of these, so a card kept under
 * its key is the card a fresh draw makes. */
export function cardKey(parts: {
  renderer: string
  browser: string
  id: string
  entry?: unknown
  lede?: string
}): string {
  const data = JSON.stringify([CARD_CACHE_VERSION, parts.id, parts.entry ?? null, parts.lede ?? null])
  return createHash("sha256").update(`${parts.renderer}\0${parts.browser}\0${data}`).digest("hex")
}

/** Every share card (the three routes, then each docs section) drawn by the
 * build's own renderer page (`<dist>/og/index.html`): its still as
 * og/<id>.png and its loop as og/<id>.gif, which the pages' og tags, Discord
 * component embeds and oEmbed photos point at. A few pages draw at once
 * (encoding is CPU-bound, one card about a second). `ledes` is each
 * section's first paragraph, which its card sets under its title. With a
 * `cache` folder, a card whose key (`cardKey`) is kept there is copied from
 * it, every card drawn is kept, and what this build did not use is
 * removed. A card that fails rejects, and the build with it. Answers the
 * number drawn (0: no renderer, or every card came from the cache). */
export async function renderOgCards(opts: {
  browser: CardBrowser
  /** Where `dist` is served, the deploy's base included, no slash at its end. */
  origin: string
  dist: string
  ledes: Record<string, string>
  cache?: string
  log?: (line: string) => void
}): Promise<number> {
  const { browser, origin, dist, ledes, cache, log = console.log } = opts
  const renderer = join(dist, "og", "index.html")
  if (!existsSync(renderer)) {
    log("og: no renderer page — skipping cards (the build's og/index entry makes it)")
    return 0
  }
  await writeFile(join(dist, "og", "ledes.json"), JSON.stringify(ledes))
  const manifest: { id: string }[] = JSON.parse(await readFile(join(dist, "og", "sections.json"), "utf8"))
  const open = async () => {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
    await page.goto(`${origin}/og/index.html`, { waitUntil: "load" })
    await page.waitForFunction(() => document.title !== "og-loading", undefined, { timeout: 15_000 })
    if ((await page.title()) !== "og-ready") throw new Error("og: the renderer failed to load its cards")
    return page
  }
  const first = await open()
  const ids = await first.evaluate(() => (window as unknown as OgWindow).og.ids())
  // Ready, the renderer shows the first card's first frame: how this
  // browser paints the card's faces.
  const painted = await first.evaluate(() => document.querySelector("canvas")?.toDataURL("image/png") ?? "")
  const drawer = `${browser.version?.() ?? ""}\0${painted}`
  const hash = await rendererHash(dist)
  const keys = new Map(
    ids.map((id) => [
      id,
      cardKey({ renderer: hash, browser: drawer, id, entry: manifest.find((s) => s.id === id), lede: ledes[id] }),
    ]),
  )
  const kept = (id: string, ext: string) => join(cache ?? "", `${keys.get(id)}.${ext}`)
  const queue: string[] = []
  for (const id of ids)
    if (cache && existsSync(kept(id, "png")) && existsSync(kept(id, "gif")))
      for (const ext of ["png", "gif"]) await copyFile(kept(id, ext), join(dist, "og", `${id}.${ext}`))
    else queue.push(id)
  const total = queue.length
  let done = 0
  let bytes = 0
  const started = Date.now()
  if (cache) await mkdir(cache, { recursive: true })
  const work = async (page: CardPage) => {
    for (let id = queue.shift(); id; id = queue.shift()) {
      const files = await page.evaluate((id: string) => (window as unknown as OgWindow).og.files(id), id)
      const png = Buffer.from(files.png, "base64")
      const gif = Buffer.from(files.gif, "base64")
      if (!png.length || !gif.length) throw new Error(`og: the card ${id} came out empty`)
      for (const [ext, data] of [
        ["png", png],
        ["gif", gif],
      ] as const) {
        await writeFile(join(dist, "og", `${id}.${ext}`), data)
        // Written aside and moved in: a killed build never keeps half a card.
        if (cache) {
          await writeFile(`${kept(id, ext)}.part`, data)
          await rename(`${kept(id, ext)}.part`, kept(id, ext))
        }
      }
      bytes += png.length + gif.length
      done++
    }
    await page.close()
  }
  const more = Math.min(3, Math.max(0, total - 1))
  const pages = [first, ...(await Promise.all(Array.from({ length: more }, open)))]
  await Promise.all(pages.map(work))
  if (cache) {
    const used = new Set([...keys.values()].flatMap((k) => [`${k}.png`, `${k}.gif`]))
    for (const name of await readdir(cache)) if (!used.has(name)) await rm(join(cache, name), { force: true })
  }
  const seconds = ((Date.now() - started) / 1000).toFixed(0)
  const from = cache ? `, ${ids.length - total} from the cache` : ""
  log(
    `og: drew ${done}/${ids.length} share cards -> og/<id>.png + .gif (${(bytes / 1048576).toFixed(1)} MB, ${seconds}s)${from}`,
  )
  return done
}

/** What the mounted Studio answers as `window.ditherStudio`, restated and
 * held like `OgWindow`. */
export interface StudioWindow {
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
