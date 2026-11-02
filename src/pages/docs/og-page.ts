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
import { ogInks, ogPrint } from "./og-art"
import {
  OG_DELAY,
  OG_EMBER,
  OG_FRAMES,
  OG_H,
  OG_INK,
  OG_PRINT,
  OG_TEXT,
  OG_W,
  ogCardSeed,
  ogWrap,
  type OgCard,
} from "./og-card"

type Section = { id: string; label: string; url: string }
type Files = { png: string; gif: string }

declare global {
  interface Window {
    og: {
      ready: Promise<unknown>
      card: (id: string, seed?: number, inv?: boolean) => OgCard
      ids: () => string[]
      files: (id: string, seed?: number, inv?: boolean) => Promise<Files>
    }
  }
}

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

function cardOf(id: string, seed = 0, inv = false): OgCard {
  const route = ROUTE_CARDS.find((r) => r.id === id)
  if (route) return { id, kind: "route", title: route.title, line: route.line, seed: seed || ogCardSeed(id), inv }
  const s = SECTIONS.find((x) => x.id === id) ?? SECTIONS[0]
  return {
    id: s.id,
    kind: "section",
    title: s.label.replace(/\.+$/, ""),
    line: s.url.replace(/^https?:\/\//, ""),
    seed: seed || ogCardSeed(s.id),
    inv,
  }
}

/** The brand, top left on the print's top line: the kit's 7x7 diamond (its
 * core the ember) and the name, as the site's header sets it. */
function brand(ink: string) {
  ctx.fillStyle = ink
  ;[1, 3, 5, 7, 5, 3, 1].forEach((w, row) => ctx.fillRect(OG_TEXT.x + (7 - w) * 1.5, OG_PRINT.y + row * 3, w * 3, 3))
  ctx.fillStyle = OG_EMBER
  ctx.fillRect(OG_TEXT.x + 9, OG_PRINT.y + 9, 3, 3)
  ctx.fillStyle = ink
  ctx.font = `500 22px ${MONO}`
  ctx.fillText("dither-ui", OG_TEXT.x + 33, OG_PRINT.y + 18)
}

/** The title in the display face, in as few lines as fit (a route's on
 * one), then its line in the muted ink, the last line's foot on the
 * print's foot. */
function type(card: OgCard, ink: { ink: string; muted: string }) {
  const route = card.kind === "route"
  ctx.font = `400 ${route ? 24 : 22}px ${MONO}`
  const lines = ogWrap(card.line.split(" "), (t) => ctx.measureText(t).width, OG_TEXT.max).slice(0, 2)
  ctx.fillStyle = ink.muted
  lines.forEach((l, i) => ctx.fillText(l, OG_TEXT.x, OG_TEXT.base - (lines.length - 1 - i) * 34))
  let size = route ? 64 : 50
  let title: string[] = []
  for (;;) {
    ctx.font = `400 ${size}px ${DISPLAY}`
    title = ogWrap(card.title.split(" "), (t) => ctx.measureText(t).width, OG_TEXT.max)
    const widest = Math.max(...title.map((l) => ctx.measureText(l).width))
    if ((widest <= OG_TEXT.max && title.length <= (route ? 1 : 2)) || size <= 30) break
    size -= 2
  }
  const last = OG_TEXT.base - (lines.length - 1) * 34 - (route ? 72 : 62)
  const lead = Math.round(size * 1.3)
  ctx.fillStyle = ink.ink
  title.forEach((l, i) => ctx.fillText(l, OG_TEXT.x, last - (title.length - 1 - i) * lead))
}

function draw(card: OgCard, phase: number) {
  const ink = OG_INK[card.inv ? "day" : "night"]
  ctx.fillStyle = ink.ground
  ctx.fillRect(0, 0, OG_W, OG_H)
  const art = ogPrint(card, phase)
  sheetCtx.putImageData(new ImageData(art.data, art.width, art.height), 0, 0)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(sheet, OG_PRINT.x, OG_PRINT.y, OG_PRINT.cols * OG_PRINT.cell, OG_PRINT.rows * OG_PRINT.cell)
  brand(ink.ink)
  type(card, ink)
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
  ids: () => [...ROUTE_CARDS.map((r) => r.id), ...SECTIONS.map((s) => s.id)],
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
    const keep = [...[ink.ground, ink.ink, ink.muted, OG_EMBER].map(hex), ...ogInks(card).map((c) => [...c])]
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
