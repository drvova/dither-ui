// The share card renderer, built as its own page (`og/index.html`, by
// `build/og-page.ts`): one 1200x630 canvas. The post-build
// asks `window.og.files(id)` for every card's PNG and GIF; the
// Discord service draws re-rolled and day cards with
// `window.og.files(id, seed, inv)`. `?id=<card>&seed=<n>&inv=<0|1>` draws a
// card's first frame and flips the title to "og-ready"; `&play` loops it in
// place for a look. Sections come from ./sections.json (the crawler
// plugin's manifest), routes from ROUTE_CARDS.
import "@/shared/fonts/display.css"
import { encodeGif } from "@/shared/lib/gif"
import { MARK_CELLS } from "@/shared/ui/brand-mark"
import { ROUTE_CARDS } from "./crawler-files"
import { ogInks, ogPrint } from "./og-art"
import {
  OG_BAYER,
  OG_BRAND,
  OG_DELAY,
  OG_EMBER,
  OG_FLOOR,
  OG_FRAMES,
  OG_H,
  OG_INK,
  OG_KEY,
  OG_KEY_H,
  OG_PRINT,
  OG_TEXT,
  OG_TITLE,
  OG_W,
  ogCardSeed,
  ogLede,
  ogWrap,
  type OgCard,
} from "./og-card"

type Section = { id: string; label: string; url: string }
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

/** A card and what it sets: its key's label (where the card's first link
 * goes) and its address. */
type Sheet = OgCard & { key: string; address: string }

const MONO = 'ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace'
const DISPLAY = `"Michroma", ${MONO}`

const canvas = document.getElementById("og") as HTMLCanvasElement
const ctx = canvas.getContext("2d", { willReadFrequently: true })!
// The print and its floor at one pixel a cell, scaled up whole onto the card.
const sheet = document.createElement("canvas")
sheet.width = OG_PRINT.cols
sheet.height = OG_PRINT.rows + OG_PRINT.floor
const sheetCtx = sheet.getContext("2d")!

let SECTIONS: Section[] = []
// Each section's lede, which the prerender lifts from the docs (absent on a
// build that skipped it: a section card then sets no line).
let LEDES: Record<string, string> = {}
const ready = Promise.all([
  fetch("./sections.json")
    .then((r) => r.json())
    .then((s: Section[]) => {
      SECTIONS = s
    }),
  fetch("./ledes.json")
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((l: Record<string, string>) => {
      LEDES = l
    }),
  document.fonts.load(`400 64px ${DISPLAY}`),
])

const ids = () => [...ROUTE_CARDS.map((r) => r.id), ...SECTIONS.map((s) => s.id)]
const bare = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "")

function cardOf(id: string, seed = 0, inv = false): Sheet {
  const route = ROUTE_CARDS.find((r) => r.id === id)
  if (route)
    return {
      id,
      kind: "route",
      title: route.title,
      line: route.line,
      seed: seed || ogCardSeed(id),
      inv,
      key: route.links[0].label,
      address: bare(route.url),
    }
  const s = SECTIONS.find((x) => x.id === id) ?? SECTIONS[0]
  return {
    id: s.id,
    kind: "section",
    title: s.label.replace(/\.+$/, ""),
    line: LEDES[s.id] ?? "",
    seed: seed || ogCardSeed(s.id),
    inv,
    key: "Open the docs",
    address: bare(s.url),
  }
}

type Ink = (typeof OG_INK)["night" | "day"]

/** The brand top left, as the site's header sets it: the mark's cells
 * (its core the ember), 3px each, and the name. */
function brand(ink: Ink) {
  const { x, y } = OG_BRAND
  for (const c of MARK_CELLS) {
    ctx.fillStyle = c.core ? OG_EMBER : ink.ink
    ctx.fillRect(x + c.x * 3, y + c.y * 3, 3, 3)
  }
  ctx.fillStyle = ink.ink
  ctx.font = `500 21px ${MONO}`
  ctx.fillText("dither-ui", x + 33, y + 17)
}

/** A key: a capsule, its label in the mono. The satin one is the site's
 * primary key; the other a filled ground, as the hero's second keys. */
function key(label: string, x: number, y: number, satin: boolean, ink: Ink): number {
  ctx.font = `500 19px ${MONO}`
  const w = Math.ceil(ctx.measureText(label).width) + 44
  const h = OG_KEY_H
  if (satin) {
    const g = ctx.createLinearGradient(0, y, 0, y + h)
    OG_KEY.forEach(([at, c]) => g.addColorStop(at, c))
    ctx.fillStyle = g
  } else ctx.fillStyle = ink.raised
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, h / 2)
  ctx.fill()
  if (satin) {
    ctx.fillStyle = "rgb(255 255 255 / 0.9)"
    ctx.fillRect(x + h / 2, y + 1, w - h, 1)
  }
  ctx.fillStyle = satin ? OG_INK.night.ground : ink.ink
  ctx.fillText(label, x + 22, y + h / 2 + 7)
  return w
}

/** The statement, as the hero sets it: the title in chrome (the display
 * face, the site's ramp one horizon per line), its line in the muted mono,
 * then the keys; the block stands on the print's middle. */
function statement(card: Sheet, ink: Ink) {
  const route = card.kind === "route"
  let size = OG_TITLE.size
  let title: string[]
  for (;;) {
    ctx.font = `400 ${size}px ${DISPLAY}`
    title = ogWrap(card.title.split(" "), (t) => ctx.measureText(t).width, OG_TEXT.max)
    const widest = Math.max(...title.map((l) => ctx.measureText(l).width))
    if ((widest <= OG_TEXT.max && title.length <= (route ? 1 : 2)) || size <= 36) break
    size -= 2
  }
  ctx.font = `400 21px ${MONO}`
  const lines = card.line ? ogLede(card.line, (t) => ctx.measureText(t).width, OG_TEXT.max) : []
  const lead = Math.round(size * 1.18)
  const height = title.length * lead + (lines.length ? 18 + lines.length * OG_TEXT.lead : 0) + 30 + OG_KEY_H
  let y = Math.round(OG_PRINT.y + (OG_PRINT.rows * OG_PRINT.cell) / 2 - height / 2)
  title.forEach((l) => {
    const base = y + size * 0.92
    const ramp = ctx.createLinearGradient(0, base - size * 0.82, 0, base + size * 0.12)
    ink.chrome.forEach(([at, c]) => ramp.addColorStop(at, c))
    ctx.fillStyle = ramp
    ctx.font = `400 ${size}px ${DISPLAY}`
    ctx.fillText(l, OG_TEXT.x, base)
    y += lead
  })
  if (lines.length) {
    y += 18
    ctx.font = `400 21px ${MONO}`
    ctx.fillStyle = ink.muted
    lines.forEach((l) => {
      ctx.fillText(l, OG_TEXT.x, y + 22)
      y += OG_TEXT.lead
    })
  }
  y += 30
  const w = key(card.key, OG_TEXT.x, y, true, ink)
  key(card.address, OG_TEXT.x + w + 10, y, false, ink)
}

/** The print on the card's right, standing over its floor: the same print
 * at the same moment turned over and thinned through the Bayer matrix, as
 * the hero's stands on the obsidian. */
function print(card: Sheet, phase: number) {
  const { x, y, cell, cols, rows, floor } = OG_PRINT
  const art = ogPrint(card, phase)
  const img = sheetCtx.createImageData(cols, rows + floor)
  img.data.set(art.data)
  for (let r = 0; r < floor; r++) {
    const tone = OG_FLOOR * (1 - (r + 0.5) / floor)
    const from = (rows - 1 - r) * cols * 4
    const to = (rows + r) * cols * 4
    for (let c = 0; c < cols; c++)
      if ((OG_BAYER[r & 3][c & 3] + 0.5) / 16 < tone)
        for (let k = 0; k < 4; k++) img.data[to + c * 4 + k] = art.data[from + c * 4 + k]
  }
  sheetCtx.putImageData(img, 0, 0)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(sheet, x, y, cols * cell, (rows + floor) * cell)
}

function draw(card: Sheet, phase: number) {
  const ink = OG_INK[card.inv ? "day" : "night"]
  ctx.fillStyle = ink.ground
  ctx.fillRect(0, 0, OG_W, OG_H)
  print(card, phase)
  brand(ink)
  statement(card, ink)
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
      ...[ink.ground, ink.ink, ink.muted, ink.raised, OG_EMBER].map(hex),
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
