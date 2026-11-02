// The share card renderer, built as its own page (`dist/og/index.html`,
// the `og/index` entry in rstack.config.ts): one 1200x630 canvas. The
// prerender asks `window.og.files(id)` for every card's PNG and GIF; the
// Discord service draws re-rolled and day cards with
// `window.og.files(id, seed, inv)`. `?id=<card>&seed=<n>&inv=<0|1>` draws a
// card's first frame and flips the title to "og-ready"; `&play` loops it in
// place for a look. Sections come from ./sections.json (the crawler
// plugin's manifest), routes from ROUTE_CARDS.
import "@/shared/fonts/display.css"
import { encodeGif } from "@/shared/lib/gif"
import { ROUTE_CARDS } from "./crawler-files"
import { ogInks, ogPrint, ogScreen } from "./og-art"
import {
  OG_BAYER,
  OG_CUT,
  OG_GHOST,
  OG_DELAY,
  OG_EMBER,
  OG_FRAMES,
  OG_H,
  OG_INK,
  OG_KEY,
  OG_PRINT,
  OG_PRINT_INKS,
  OG_SLANT,
  OG_TEXT,
  OG_W,
  ogCardSeed,
  ogWrap,
  type OgCard,
} from "./og-card"

type Section = { id: string; label: string; url: string; group: string }
type Files = { png: string; gif: string }

declare global {
  interface Window {
    og: {
      ready: Promise<unknown>
      card: (id: string, seed?: number, inv?: boolean) => Sheet
      ids: () => string[]
      files: (id: string, seed?: number, inv?: boolean) => Promise<Files>
    }
  }
}

/** A card and what its spec sheet prints: the speed tag (a route's own, a
 * section's family), the card's number of all the cards, its address. */
type Sheet = OgCard & { tag: string; no: number; of: number; address: string }

const MONO = 'ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace'
const DISPLAY = `"Michroma", ${MONO}`

const canvas = document.getElementById("og") as HTMLCanvasElement
const ctx = canvas.getContext("2d", { willReadFrequently: true })!
// The print at one pixel a cell, scaled up whole onto the card.
const sheet = document.createElement("canvas")
sheet.width = OG_PRINT.cols
sheet.height = OG_PRINT.rows
const sheetCtx = sheet.getContext("2d")!

let SECTIONS: Section[] = []
const ready = Promise.all([
  fetch("./sections.json")
    .then((r) => r.json())
    .then((s: Section[]) => {
      SECTIONS = s
    }),
  document.fonts.load(`400 64px ${DISPLAY}`),
])

const ids = () => [...ROUTE_CARDS.map((r) => r.id), ...SECTIONS.map((s) => s.id)]

function cardOf(id: string, seed = 0, inv = false): Sheet {
  const all = ids()
  const route = ROUTE_CARDS.find((r) => r.id === id)
  if (route)
    return {
      id,
      kind: "route",
      title: route.title,
      line: route.line,
      seed: seed || ogCardSeed(id),
      inv,
      tag: route.tag,
      no: all.indexOf(id) + 1,
      of: all.length,
      address: route.url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    }
  const s = SECTIONS.find((x) => x.id === id) ?? SECTIONS[0]
  const address = s.url.replace(/^https?:\/\//, "")
  return {
    id: s.id,
    kind: "section",
    title: s.label.replace(/\.+$/, ""),
    line: address,
    seed: seed || ogCardSeed(s.id),
    inv,
    tag: s.group,
    no: all.indexOf(s.id) + 1,
    of: all.length,
    address,
  }
}

type Ink = (typeof OG_INK)["night" | "day"]

/** Small caps, tracked: the spec label's voice. */
function spec(size: number) {
  ctx.font = `500 ${size}px ${MONO}`
  ctx.letterSpacing = `${(size * 0.14).toFixed(1)}px`
}

/** A slanted plate, its edges cut, from `x` at its foot: the speed tag's
 * and a chip's shape. */
function plate(x: number, y: number, w: number, h: number, fill: string) {
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.moveTo(x + OG_SLANT, y)
  ctx.lineTo(x + w, y)
  ctx.lineTo(x + w - OG_SLANT, y + h)
  ctx.lineTo(x, y + h)
  ctx.closePath()
  ctx.fill()
}

/** Text set on a plate, its width the text's and a pad each side. */
function plated(text: string, x: number, y: number, h: number, size: number, fill: string, ink: string) {
  spec(size)
  const w = Math.ceil(ctx.measureText(text).width) + 2 * OG_SLANT + 14
  plate(x, y, w, h, fill)
  ctx.fillStyle = ink
  ctx.fillText(text, x + OG_SLANT + 7, y + h / 2 + size * 0.36)
  return w
}

/** The brand top left, on the print's top line, and the card's number of
 * all the cards at the column's end: the sheet's provenance. */
function head(card: Sheet, ink: Ink) {
  ctx.letterSpacing = "0px"
  ctx.fillStyle = ink.ink
  ;[1, 3, 5, 7, 5, 3, 1].forEach((w, row) => ctx.fillRect(OG_TEXT.x + (7 - w) * 1.5, OG_PRINT.y + row * 3, w * 3, 3))
  ctx.fillStyle = OG_EMBER
  ctx.fillRect(OG_TEXT.x + 9, OG_PRINT.y + 9, 3, 3)
  ctx.fillStyle = ink.ink
  ctx.font = `500 22px ${MONO}`
  ctx.fillText("dither-ui", OG_TEXT.x + 33, OG_PRINT.y + 18)
  spec(15)
  ctx.fillStyle = ink.muted
  const no = `No. ${String(card.no).padStart(3, "0")} of ${card.of}`.toUpperCase()
  ctx.textAlign = "right"
  ctx.fillText(no, OG_TEXT.x + OG_TEXT.max, OG_PRINT.y + 18)
  ctx.textAlign = "left"
  // The speed tag under the brand: the page's family.
  plated(card.tag.toUpperCase(), OG_TEXT.x, OG_PRINT.y + 48, 28, 15, ink.plate, ink.plateInk)
}

/** The title in chrome (the display face, the ramp one horizon per line),
 * its line under it, the spec chips (key and value plates) and the address
 * in the satin key, the key's foot on the print's foot. */
function type(card: Sheet, ink: Ink): number {
  const route = card.kind === "route"
  const foot = OG_PRINT.y + OG_PRINT.rows * OG_PRINT.cell
  // The key: satin aluminum, obsidian ink, in either theme.
  ctx.letterSpacing = "0px"
  ctx.font = `500 20px ${MONO}`
  const kw = Math.ceil(ctx.measureText(card.address).width) + 48
  const ky = foot - 44
  const key = ctx.createLinearGradient(0, ky, 0, ky + 44)
  OG_KEY.forEach(([at, c]) => key.addColorStop(at, c))
  ctx.fillStyle = key
  ctx.beginPath()
  ctx.roundRect(OG_TEXT.x, ky, kw, 44, 22)
  ctx.fill()
  ctx.fillStyle = "rgb(255 255 255 / 0.9)"
  ctx.fillRect(OG_TEXT.x + 18, ky + 1, kw - 36, 1)
  ctx.fillStyle = OG_INK.night.ground
  ctx.fillText(card.address, OG_TEXT.x + 24, ky + 29)
  // The chips: what the print is, key and value, as a spec sheet reads.
  const cy = ky - 52
  let x = OG_TEXT.x
  for (const [k, v] of [
    ["Screen", ogScreen(card)],
    ["Seed", card.seed.toString(16).slice(-4).padStart(4, "0")],
    ["Cell", `${OG_PRINT.cell} px`],
  ]) {
    x += plated(k.toUpperCase(), x, cy, 30, 15, ink.plate, ink.plateInk) - OG_SLANT + 2
    x += plated(v.toUpperCase(), x, cy, 30, 15, ink.ink, ink.ground) + 10
  }
  // The line: a route's own, under the title (a section's is its address,
  // already on the key).
  let base = cy - 26
  if (route) {
    ctx.letterSpacing = "0px"
    ctx.font = `400 22px ${MONO}`
    ctx.fillStyle = ink.muted
    const lines = ogWrap(card.line.split(" "), (t) => ctx.measureText(t).width, OG_TEXT.max).slice(0, 2)
    lines.forEach((l, i) => ctx.fillText(l, OG_TEXT.x, base - (lines.length - 1 - i) * 32))
    base -= (lines.length - 1) * 32 + 50
  } else base -= 4
  // The title, in as few lines as fit.
  let size = route ? 66 : 54
  let title: string[] = []
  for (;;) {
    ctx.font = `400 ${size}px ${DISPLAY}`
    title = ogWrap(card.title.split(" "), (t) => ctx.measureText(t).width, OG_TEXT.max)
    const widest = Math.max(...title.map((l) => ctx.measureText(l).width))
    if ((widest <= OG_TEXT.max && title.length <= (route ? 1 : 2)) || size <= 30) break
    size -= 2
  }
  const lead = Math.round(size * 1.3)
  title.forEach((l, i) => {
    const y = base - (title.length - 1 - i) * lead
    const ramp = ctx.createLinearGradient(0, y - size * 0.82, 0, y + size * 0.12)
    ink.chrome.forEach(([at, c]) => ramp.addColorStop(at, c))
    ctx.fillStyle = ramp
    ctx.fillText(l, OG_TEXT.x, y)
  })
  // The title's top: the ghost's band ends a gap above it.
  return base - (title.length - 1) * lead - size * 0.78
}

/** The print in a hardshell: two opposite corners cut, a chrome glint on
 * its edge, and the sheet's spec run set up its side. */
function print(card: Sheet, ink: Ink, phase: number) {
  const { x, y, cell, cols, rows } = OG_PRINT
  const w = cols * cell
  const h = rows * cell
  const c = OG_CUT
  const shell = () => {
    ctx.beginPath()
    ctx.moveTo(x + c, y)
    ctx.lineTo(x + w, y)
    ctx.lineTo(x + w, y + h - c)
    ctx.lineTo(x + w - c, y + h)
    ctx.lineTo(x, y + h)
    ctx.lineTo(x, y + c)
    ctx.closePath()
  }
  const art = ogPrint(card, phase)
  sheetCtx.putImageData(new ImageData(art.data, art.width, art.height), 0, 0)
  ctx.save()
  shell()
  ctx.clip()
  ctx.fillStyle = ink.well
  ctx.fillRect(x, y, w, h)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(sheet, x, y, w, h)
  ctx.restore()
  const rim = ctx.createLinearGradient(x, y, x + w, y + h)
  ink.rim.forEach(([at, col]) => rim.addColorStop(at, col))
  ctx.strokeStyle = rim
  ctx.lineWidth = 2
  shell()
  ctx.stroke()
  // The spec run, up the print's left side: its size and its inks.
  const run = [`Print ${cols} x ${rows} cells`, OG_PRINT_INKS[card.inv ? "day" : "night"].map(inkName).join(" / ")]
    .join("   ")
    .toUpperCase()
  ctx.save()
  ctx.translate(x - 18, y + h)
  ctx.rotate(-Math.PI / 2)
  spec(13)
  ctx.fillStyle = ink.muted
  ctx.fillText(run, 0, 0)
  ctx.restore()
}

/** An ink's name on the spec run: a palette name as it is, the bone and
 * the obsidian by name. */
const inkName = (c: string) => (c === OG_INK.night.ink ? "bone" : c === OG_INK.night.ground ? "obsidian" : c)

// The ghost: the card's number, race-bib size, printed through the Bayer
// matrix in the band between the speed tag and the title (the sheet's big
// ghosted figure), never under type.
const ghost = document.createElement("canvas")
ghost.width = OG_TEXT.max
ghost.height = OG_H
const ghostCtx = ghost.getContext("2d", { willReadFrequently: true })!

function number(card: Sheet, ink: Ink, bottom: number) {
  const band = Math.floor(bottom - OG_GHOST.top)
  if (band < OG_GHOST.min) return
  const text = String(card.no).padStart(3, "0")
  // The figures' cap height fills the band, the row no wider than the column.
  ghostCtx.font = `400 100px ${DISPLAY}`
  const size = Math.min(band / OG_GHOST.cap, (100 * OG_TEXT.max) / ghostCtx.measureText(text).width)
  ghostCtx.clearRect(0, 0, ghost.width, ghost.height)
  ghostCtx.font = `400 ${size}px ${DISPLAY}`
  ghostCtx.textAlign = "right"
  ghostCtx.fillStyle = "#fff"
  ghostCtx.fillText(text, ghost.width, band)
  const lit = ghostCtx.getImageData(0, 0, ghost.width, band).data
  const c = OG_GHOST.cell
  ctx.fillStyle = ink.ink
  for (let y = 0; y + c <= band; y += c)
    for (let x = 0; x + c <= ghost.width; x += c) {
      if (lit[((y + c / 2) * ghost.width + x + c / 2) * 4 + 3] < 128) continue
      if ((OG_BAYER[(y / c) & 3][(x / c) & 3] + 0.5) / 16 > OG_GHOST.tone) continue
      ctx.fillRect(OG_TEXT.x + x, OG_GHOST.top + y, c - 1, c - 1)
    }
}

function draw(card: Sheet, phase: number) {
  const ink = OG_INK[card.inv ? "day" : "night"]
  ctx.fillStyle = ink.ground
  ctx.fillRect(0, 0, OG_W, OG_H)
  print(card, ink, phase)
  head(card, ink)
  number(card, ink, type(card, ink) - OG_GHOST.gap)
}

function base64(bytes: Uint8Array) {
  let s = ""
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))

window.og = {
  ready,
  card: cardOf,
  // Every card the build draws: the routes, then each section.
  ids,
  // A card's still (its first frame) as a PNG and its loop as a GIF, base64.
  async files(id, seed, inv) {
    await ready
    const card = cardOf(id, seed, inv)
    const frames: Uint8ClampedArray[] = []
    for (let i = 0; i < OG_FRAMES; i++) {
      draw(card, i / OG_FRAMES)
      frames.push(ctx.getImageData(0, 0, OG_W, OG_H).data)
    }
    draw(card, 0)
    // The card's own colours stay exact in the GIF; its type's
    // antialiasing shares the rest.
    const ink = OG_INK[card.inv ? "day" : "night"]
    const keep = [
      ...[ink.ground, ink.ink, ink.muted, ink.plate, ink.well, OG_EMBER].map(hex),
      ...ogInks(card).map((c) => [...c]),
    ]
    const gif = encodeGif(frames, OG_W, OG_H, OG_DELAY, { keep })
    return { png: canvas.toDataURL("image/png").split(",")[1], gif: base64(gif) }
  },
}

ready
  .then(() => {
    const q = new URLSearchParams(location.search)
    const card = cardOf(q.get("id") || "home", parseInt(q.get("seed") || "0") || 0, q.get("inv") === "1")
    draw(card, 0)
    document.title = "og-ready"
    if (q.has("play")) {
      let i = 0
      setInterval(() => draw(card, (++i % OG_FRAMES) / OG_FRAMES), OG_DELAY * 10)
    }
  })
  .catch(() => {
    document.title = "og-error"
  })
