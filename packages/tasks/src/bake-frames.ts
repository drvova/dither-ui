// Baked frames: every kit canvas a prerendered page carries gets the frame
// the kit's own engine paints into it, printed into the page as its
// background at one pixel a cell, so the dither shows at first paint,
// before any script runs (`@dither-ui/kit/engine/baked.ts` is the runtime's
// half: the canvas's own first upload takes the bake off in the same task,
// and a chart or an avatar showing a settled bake starts with its entrance
// played). Run by the site's post-build over the built pages, in its
// Chromium: the frame is the engine's, read off the canvas, never redrawn.
//
// A page is loaded twice, at 1440x900 and one device pixel a CSS pixel,
// with every IntersectionObserver reporting its target in view (so every
// gated surface paints, as it would scrolled to). The first load collects:
// a canvas still that has stopped painting is baked "settled" (what it
// shows); a canvas still moving in the first window is baked "first" (its
// first upload), and a moving one below it stays as it is. The second load
// serves the page with its bakes and keeps only those the canvas's own
// first upload matches byte for byte, released by that upload. A canvas
// drawn any other way (a GL context, a bloom layer's drawImage, a
// fillRect) is never baked. What a page bakes is kept by the page's bytes
// (its scripts are named by their hashes), so a build that changes nothing
// loads nothing.
//
// A chart's print is no canvas: the kit writes its cells as an SVG
// `<image>` of a PNG at one pixel a cell (`@dither-ui/kit/engine/chart-svg.ts`,
// `PRINT_ATTR` from `baked.ts`), a data URI in the page as the server rendered it.
// `bakePrints` moves every such PNG past `INLINE_BYTES` out of the HTML into
// the same `baked/<id>.png` files the canvases' frames use, named by its
// bytes, so a page of charts carries their markup and words and the images
// load beside it. Charts drawn without a build (the Studio, the docs' Run)
// keep their data URI.
// Loaded by Node as it is (type stripping): erasable syntax only.
import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { pngBytes } from "@dither-ui/kit/engine/png.ts"
import { BAKED_ATTR, BAKED_PREFIX, type BakedKind, PRINT_ATTR } from "@dither-ui/kit/engine/baked.ts"
import type { Browser, BrowserContext } from "playwright-core"

/** The window a page is baked at: the desktop the site is drawn for. */
const BAKE_VIEWPORT = { width: 1440, height: 900 }
/** How long a page runs before its canvases are read, and the window in
 * which one that still uploads counts as moving. */
const SETTLE_MS = 3000
const QUIET_MS = 900
/** How long the check waits for every baked canvas's first upload. */
const VERIFY_MS = 4000
/** A frame up to this many bytes, or one in the first window, is written
 * into the page; a larger one further down is a file beside the pages
 * (`baked/<id>.png`), fetched beside the page's scripts and shared by every
 * page that shows it, so it never holds up the first paint. */
const INLINE_BYTES = 1536
/** The folder of the frames written as files, under the build's base. */
const BAKED_DIR = "baked"
/** The attribute that numbers a page's canvases while it is baked. */
const TAG = "data-dk-n"

/** One canvas's bake, as a page keeps it. */
export interface Bake {
  /** The canvas's place among the page's `<canvas` tags, in source order. */
  n: number
  kind: BakedKind
  width: number
  height: number
  /** The frame, a PNG at one pixel a cell, base64. */
  png: string
  /** Where the canvas stands in its box, for one the server sized 0x0 (a
   * chart's plot, measured in the browser): px from each edge. */
  inset?: [number, number, number, number]
  /** The root's theme class the frame was painted under. */
  dark: boolean
  /** Whether it stood in the first window at load. */
  above: boolean
}

/** What a page's bake did. */
interface PageBake {
  page: string
  cached: boolean
  canvases: number
  settled: number
  first: number
  /** Painted and readable, but moving below the first window or drawn by
   * another path: left live. */
  live: number
  /** Collected but refused by the check (its own first upload differed). */
  refused: number
}

type Segment = { text: string; code: boolean }

/** A page's HTML cut into markup and the script and style bodies a
 * `<canvas` inside must never be counted from. */
function segments(html: string): Segment[] {
  return html
    .split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>)/i)
    .map((text, i) => ({ text, code: i % 2 === 1 }))
}

/** Each canvas tag of the markup handed to `edit` with its number. */
function eachCanvas(html: string, edit: (n: number, tag: string) => string): string {
  let n = 0
  return segments(html)
    .map((s) => (s.code ? s.text : s.text.replace(/<canvas(?=[\s>])[^>]*>/g, (tag) => edit(n++, tag))))
    .join("")
}

/** The page with each canvas numbered, and which the server sized 0x0. */
export function tagCanvases(html: string): { html: string; zero: boolean[] } {
  const zero: boolean[] = []
  const out = eachCanvas(html, (n, tag) => {
    zero[n] = /width:0px/.test(tag) && /height:0px/.test(tag)
    return tag.replace("<canvas", `<canvas ${TAG}="${n}"`)
  })
  return { html: out, zero }
}

/** A bake's id: its frame's (and place's) hash. */
const bakedId = (b: Bake) =>
  createHash("sha256")
    .update(b.png)
    .update(JSON.stringify([b.inset ?? null, b.dark]))
    .digest("hex")
    .slice(0, 10)

/** A bake's attribute value: its kind and its id. */
export function bakedValue(b: Bake): string {
  return BAKED_PREFIX[b.kind] + bakedId(b)
}

/** A bake written beside the pages: its file in `baked/`. */
const bakedFile = (b: Bake) => `${bakedId(b)}.png`

/** Whether a bake is written into the page rather than beside it. */
function bakedInline(b: Bake): boolean {
  return b.above || (b.png.length * 3) / 4 <= INLINE_BYTES
}

/** The stylesheet that shows a page's bakes: one rule an image (canvases
 * showing the same frame share it), under the theme it was painted in; a
 * frame not written into the page is read from `files` (the build's
 * `baked/` folder as the page addresses it), or inline when none is given. */
export function bakedCss(bakes: Bake[], files?: string): string {
  if (!bakes.length) return ""
  const rules = new Map<string, string>()
  for (const b of bakes) {
    const value = bakedValue(b)
    if (rules.has(value)) continue
    const root = b.dark ? ":root.dark" : ":root:not(.dark)"
    const place = b.inset
      ? `;left:${b.inset[0]}px!important;top:${b.inset[1]}px!important;right:${b.inset[2]}px!important;bottom:${b.inset[3]}px!important;width:auto!important;height:auto!important`
      : ""
    const src = files === undefined || bakedInline(b) ? `data:image/png;base64,${b.png}` : `${files}${bakedFile(b)}`
    rules.set(value, `${root} [${BAKED_ATTR}="${value}"]{background-image:url(${src})!important${place}}`)
  }
  return (
    `[${BAKED_ATTR}]{background-repeat:no-repeat!important;background-size:100% 100%!important;` +
    `background-origin:content-box!important}` +
    [...rules.values()].join("")
  )
}

/** The page carrying its bakes: each baked canvas its attribute, the
 * stylesheet at the end of the head (`files` as `bakedCss` takes it). */
export function bakeHtml(html: string, bakes: Bake[], files?: string): string {
  if (!bakes.length) return html
  const by = new Map(bakes.map((b) => [b.n, bakedValue(b)]))
  const out = eachCanvas(html, (n, tag) => {
    const value = by.get(n)
    return value ? tag.replace("<canvas", `<canvas ${BAKED_ATTR}="${value}"`) : tag
  })
  const style = `<style data-dk-bakes>${bakedCss(bakes, files)}</style>`
  const head = out.search(/<\/head>/i)
  if (head < 0) throw new Error("bake: a page without a </head>")
  return out.slice(0, head) + style + out.slice(head)
}

/** A chart print's PNG moved out of a page: its file in `baked/`. */
export interface PrintFile {
  name: string
  png: string
}

/**
 * The page with each chart print's PNG past `INLINE_BYTES` read from
 * `files` (the build's `baked/` folder as the page addresses it) in place
 * of its data URI, and the files to write, each named by its bytes (a
 * print two pages show is one file). Only the kit's print images, never
 * one inside a script or a style.
 */
export function bakePrints(html: string, files: string): { html: string; prints: PrintFile[] } {
  const prints = new Map<string, PrintFile>()
  const image = new RegExp(`(<image ${PRINT_ATTR}\\b[^>]*?href=")data:image/png;base64,([A-Za-z0-9+/=]+)"`, "g")
  const out = segments(html)
    .map((s) =>
      s.code
        ? s.text
        : s.text.replace(image, (whole, head: string, png: string) => {
            if ((png.length * 3) / 4 <= INLINE_BYTES) return whole
            const name = `${createHash("sha256").update(png).digest("hex").slice(0, 10)}.png`
            prints.set(name, { name, png })
            return `${head}${files}${name}"`
          }),
    )
    .join("")
  return { html: out, prints: [...prints.values()] }
}

/** What a page's canvas showed, read in the page. */
interface Seen {
  n: number
  width: number
  height: number
  puts: number
  /** Uploads in the quiet window. */
  recent: number
  /** Ways it was drawn besides a whole-canvas putImageData and clearRect. */
  other: string[]
  /** Its first upload's bytes, base64, and whether a bake still stood. */
  first: string | null
  firstBaked: boolean
  /** What it shows now, base64 (a still canvas only). */
  now: string | null
  /** Whether it stood in the first window at load. */
  above: boolean
  inset: [number, number, number, number] | null
  dark: boolean
}

/** In every page before its scripts: every observer reports its target in
 * view, and each canvas's uploads are counted, its first kept. */
function instrument(tag: string) {
  type Rec = {
    puts: number
    last: number
    other: Set<string>
    first: Uint8ClampedArray | null
    firstBaked: boolean
    /** The last whole upload's bytes: what it shows, exactly as painted
     * (a read back through the canvas rounds a translucent cell's colour). */
    shows: Uint8ClampedArray | null
  }
  const recs = new Map<HTMLCanvasElement, Rec>()
  const rec = (c: HTMLCanvasElement) => {
    let r = recs.get(c)
    if (!r) recs.set(c, (r = { puts: 0, last: 0, other: new Set(), first: null, firstBaked: false, shows: null }))
    return r
  }
  class InView {
    cb: IntersectionObserverCallback
    els = new Set<Element>()
    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb
    }
    observe(el: Element) {
      if (this.els.has(el)) return
      this.els.add(el)
      setTimeout(() => {
        if (!this.els.has(el)) return
        const r = el.getBoundingClientRect()
        const entry = {
          target: el,
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: r,
          intersectionRect: r,
          rootBounds: null,
          time: performance.now(),
        }
        this.cb([entry as IntersectionObserverEntry], this as unknown as IntersectionObserver)
      }, 0)
    }
    unobserve(el: Element) {
      this.els.delete(el)
    }
    disconnect() {
      this.els.clear()
    }
    takeRecords() {
      return []
    }
  }
  Object.assign(window, { IntersectionObserver: InView })
  const P = CanvasRenderingContext2D.prototype
  const put = P.putImageData
  P.putImageData = function (this: CanvasRenderingContext2D, ...args: unknown[]) {
    const c = this.canvas
    const r = rec(c)
    const [img, dx, dy] = args as [ImageData, number, number]
    const whole = args.length === 3 && dx === 0 && dy === 0 && img.width === c.width && img.height === c.height
    const baked = c.hasAttribute("data-dk-baked")
    ;(put as (...a: unknown[]) => void).apply(this, args)
    r.puts++
    r.last = performance.now()
    if (!whole) r.other.add("putImageData(part)")
    else {
      r.shows = img.data.slice()
      if (!r.first) {
        r.first = r.shows
        r.firstBaked = baked
      }
    }
  } as typeof P.putImageData
  for (const m of ["fillRect", "strokeRect", "drawImage", "fill", "stroke", "fillText", "strokeText"] as const) {
    const f = P[m] as (...a: unknown[]) => unknown
    ;(P as unknown as Record<string, unknown>)[m] = function (this: CanvasRenderingContext2D, ...a: unknown[]) {
      const r = rec(this.canvas)
      r.other.add(m)
      r.last = performance.now()
      return f.apply(this, a)
    }
  }
  const getContext = HTMLCanvasElement.prototype.getContext as (...a: unknown[]) => unknown
  ;(HTMLCanvasElement.prototype as unknown as Record<string, unknown>).getContext = function (
    this: HTMLCanvasElement,
    type: string,
    ...a: unknown[]
  ) {
    if (type !== "2d") rec(this).other.add(type)
    return getContext.call(this, type, ...a)
  }
  const b64 = (d: Uint8ClampedArray) => {
    let s = ""
    for (let k = 0; k < d.length; k += 0x8000) s += String.fromCharCode(...d.subarray(k, k + 0x8000))
    return btoa(s)
  }
  Object.assign(window, {
    __bake: {
      quiet: () => {
        const mark = new Map([...recs].map(([c, r]) => [c, r.puts]))
        return (c: HTMLCanvasElement) => (recs.get(c)?.puts ?? 0) - (mark.get(c) ?? 0)
      },
      read: (recent: (c: HTMLCanvasElement) => number) =>
        [...document.querySelectorAll<HTMLCanvasElement>(`canvas[${tag}]`)].map((c) => {
          const r = recs.get(c)
          const box = c.getBoundingClientRect()
          const parent = c.offsetParent as HTMLElement | null
          const moving = recent(c)
          const plain = !!r && r.puts > 0 && r.other.size === 0 && moving === 0
          return {
            n: Number(c.getAttribute(tag)),
            width: c.width,
            height: c.height,
            puts: r?.puts ?? 0,
            recent: moving,
            other: [...(r?.other ?? [])],
            first: r?.first ? b64(r.first) : null,
            firstBaked: r?.firstBaked ?? false,
            now: plain && r.shows ? b64(r.shows) : null,
            above: box.bottom > 0 && box.top < innerHeight && box.width > 0,
            inset: parent
              ? [
                  c.offsetLeft,
                  c.offsetTop,
                  parent.clientWidth - c.offsetLeft - c.offsetWidth,
                  parent.clientHeight - c.offsetTop - c.offsetHeight,
                ]
              : null,
            dark: document.documentElement.classList.contains("dark"),
          }
        }),
    },
  })
}

type BakeWindow = {
  __bake: {
    quiet: () => (c: HTMLCanvasElement) => number
    read: (recent: (c: HTMLCanvasElement) => number) => Seen[]
  }
}

/** Load `html` at `url` in a fresh context and read its canvases after
 * `settle` ms and a quiet window; with `scroll`, read again once the page
 * has been scrolled through to its end (what a scroll drives has moved). */
async function load(
  browser: Browser,
  url: string,
  html: string,
  settle: number,
  scroll = false,
): Promise<{ seen: Seen[]; scrolled: Seen[]; resized: number[] }> {
  const context: BrowserContext = await browser.newContext({
    viewport: BAKE_VIEWPORT,
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  })
  try {
    await context.addInitScript(instrument, TAG)
    await context.route(url, (route) => route.fulfill({ body: html, contentType: "text/html; charset=utf-8" }))
    const page = await context.newPage()
    await page.goto(url, { waitUntil: "load" })
    await page.waitForTimeout(settle)
    await page.evaluate(() => {
      const w = window as unknown as BakeWindow & { __quiet?: (c: HTMLCanvasElement) => number }
      w.__quiet = w.__bake.quiet()
    })
    await page.waitForTimeout(QUIET_MS)
    const seen = await page.evaluate(() => {
      const w = window as unknown as BakeWindow & { __quiet: (c: HTMLCanvasElement) => number }
      return w.__bake.read(w.__quiet)
    })
    if (!scroll) return { seen, scrolled: [], resized: [] }
    // Each canvas's laid-out box at every step: one the scroll resizes (a
    // scene scaling it into place) has no one grid a bake could hold.
    const resized = await page.evaluate(async (tag) => {
      const canvases = [...document.querySelectorAll<HTMLCanvasElement>(`canvas[${tag}]`)]
      const box = (c: HTMLCanvasElement) => {
        const r = c.getBoundingClientRect()
        return `${Math.round(r.width)}x${Math.round(r.height)}`
      }
      const first = canvases.map(box)
      const moved = new Set<number>()
      const end = document.documentElement.scrollHeight - innerHeight
      for (let y = 0; y <= end + innerHeight / 8; y += innerHeight / 8) {
        scrollTo(0, Math.min(y, end))
        await new Promise((r) => setTimeout(r, 150))
        canvases.forEach((c, i) => box(c) !== first[i] && moved.add(Number(c.getAttribute(tag))))
      }
      return [...moved]
    }, TAG)
    await page.waitForTimeout(QUIET_MS)
    const scrolled = await page.evaluate(() => (window as unknown as BakeWindow).__bake.read(() => 0))
    return { seen, scrolled, resized }
  } finally {
    await context.close()
  }
}

const bytes = (b64: string) => Buffer.from(b64, "base64")
const blank = (data: Buffer) => {
  for (let i = 3; i < data.length; i += 4) if (data[i]) return false
  return true
}

/** Bake one page's canvases: collect, then keep what its own first upload
 * matches. */
async function bakePage(
  browser: Browser,
  url: string,
  html: string,
): Promise<Omit<PageBake, "page" | "cached"> & { bakes: Bake[] }> {
  const { html: tagged, zero } = tagCanvases(html)
  const { seen, scrolled, resized } = await load(browser, url, tagged, SETTLE_MS, true)
  // A still canvas that shows something else once the page has scrolled
  // past it, or whose box the scroll resizes, is art the scroll drives:
  // never settled.
  const after = new Map(scrolled.map((s) => [s.n, s]))
  const offered: Bake[] = []
  let live = 0
  for (const s of seen) {
    const plain = s.puts > 0 && s.other.length === 0 && s.width > 0 && s.height > 0
    const still = !!s.now && after.get(s.n)?.now === s.now && !resized.includes(s.n)
    const kind: BakedKind | null = !plain
      ? null
      : s.recent === 0 && still
        ? "settled"
        : s.above && s.first
          ? "first"
          : null
    const frame = kind === "settled" ? s.now : kind === "first" ? s.first : null
    if ((s.puts > 0 || s.other.length > 0) && !frame) live++
    if (!kind || !frame) continue
    const data = bytes(frame)
    if (data.length !== s.width * s.height * 4 || blank(data)) continue
    offered.push({
      n: s.n,
      kind,
      width: s.width,
      height: s.height,
      png: Buffer.from(pngBytes(s.width, s.height, data)).toString("base64"),
      ...(zero[s.n] && s.inset ? { inset: s.inset } : {}),
      dark: s.dark,
      above: s.above,
    })
  }
  const frames = new Map(offered.map((b) => [b.n, b]))
  const raws = new Map(seen.map((s) => [s.n, s]))
  const kept: Bake[] = []
  if (offered.length) {
    const { seen: checked } = await load(browser, url, tagCanvases(bakeHtml(html, offered)).html, VERIFY_MS - QUIET_MS)
    for (const c of checked) {
      const b = frames.get(c.n)
      const was = raws.get(c.n)
      if (!b || !was || !c.first || c.firstBaked || c.other.length) continue
      const want = bytes(b.kind === "settled" ? was.now! : was.first!)
      if (c.width === b.width && c.height === b.height && bytes(c.first).equals(want)) kept.push(b)
    }
  }
  const count = (k: BakedKind) => kept.filter((b) => b.kind === k).length
  return {
    canvases: seen.length,
    settled: count("settled"),
    first: count("first"),
    live,
    refused: offered.length - kept.length,
    bakes: kept,
  }
}

/** Bake every page named (paths under `dist`, served at `origin`, the
 * build's `base` on its server), keeping each page's bakes in `cache` by its
 * bytes; a page with no canvas is left as it is. */
export async function bakeFrames(opts: {
  browser: Browser
  origin: string
  base: string
  dist: string
  pages: string[]
  cache: string
  jobs?: number
}): Promise<{ pages: PageBake[]; prints: number }> {
  await mkdir(opts.cache, { recursive: true })
  await mkdir(join(opts.dist, BAKED_DIR), { recursive: true })
  const files = `${opts.base.replace(/\/?$/, "/")}${BAKED_DIR}/`
  // This module's own bytes are in every key: a change to how a page is
  // baked bakes it again.
  const self = await readFile(fileURLToPath(import.meta.url), "utf8")
  const queue = opts.pages.filter((p) => existsSync(join(opts.dist, p)))
  const done: PageBake[] = []
  const printed: string[] = []
  const work = async () => {
    for (let page = queue.shift(); page !== undefined; page = queue.shift()) {
      const path = join(opts.dist, page)
      // The charts' prints first: a pure rewrite of the page by its bytes.
      const { html, prints } = bakePrints(await readFile(path, "utf8"), files)
      for (const p of prints) await writeFile(join(opts.dist, BAKED_DIR, p.name), Buffer.from(p.png, "base64"))
      printed.push(...prints.map((p) => p.name))
      if (!tagCanvases(html).zero.length) {
        if (prints.length) await writeFile(path, html)
        continue
      }
      const key = createHash("sha256").update(self).update(JSON.stringify(BAKE_VIEWPORT)).update(html).digest("hex")
      const file = join(opts.cache, `${key}.json`)
      const hit = existsSync(file)
      const result = hit
        ? (JSON.parse(await readFile(file, "utf8")) as Awaited<ReturnType<typeof bakePage>>)
        : await bakePage(opts.browser, `${opts.origin}/${page.replace(/index\.html$/, "")}`, html)
      if (!hit) await writeFile(file, JSON.stringify(result))
      for (const b of result.bakes)
        if (!bakedInline(b)) await writeFile(join(opts.dist, BAKED_DIR, bakedFile(b)), Buffer.from(b.png, "base64"))
      await writeFile(path, bakeHtml(html, result.bakes, files))
      const { bakes: _, ...counts } = result
      done.push({ page, cached: hit, ...counts })
    }
  }
  await Promise.all(Array.from({ length: opts.jobs ?? 3 }, work))
  return { pages: done.sort((a, b) => a.page.localeCompare(b.page)), prints: new Set(printed).size }
}
