// What the frame reader's parts share (`vector.ts` walks, `box.ts` paints
// a box): the walk's state, colours as the page computes them read as
// paints, and boxes in the frame's px. Touches the page only when called.
import { type Paint, parseColor } from "./svg"

/** A layer's group, by the element it starts at. */
export type Anchors = Map<Element, string>

export type Walk = {
  /** The surface's top-left on the page and the canvas's zoom. */
  ox: number
  oy: number
  zoom: number
  /** The frame's box, for what lies wholly outside it. */
  w: number
  h: number
  anchors: Anchors
  defs: Map<string, string>
  /** What the reader approximated, by kind, counted (the file's `<desc>`). */
  notes: Map<string, number>
  /** What is left out with all it holds (the docs workbench's overlay). */
  skip?: (el: Element) => boolean
}

/* --------------------------------- colour -------------------------------- */

const colorCache = new Map<string, Paint | null>()
let probe: CanvasRenderingContext2D | null | undefined

/** Any CSS colour the page computes (`oklch()`, `color-mix()`'s `oklab()`,
 * `color(srgb …)`) as a paint: rgb and hex read here, the rest drawn on a
 * pixel and read back. Null for a clear colour. */
export function paintOf(css: string): Paint | null {
  if (!css || css === "transparent" || css === "none") return null
  const cached = colorCache.get(css)
  if (cached !== undefined) return cached
  let paint = parseColor(css)
  if (!paint && !/^(rgba?|#)/i.test(css.trim())) {
    if (probe === undefined) {
      const c = document.createElement("canvas")
      c.width = c.height = 1
      try {
        probe = c.getContext("2d", { willReadFrequently: true })
      } catch {
        probe = null
      }
    }
    try {
      if (probe) {
        probe.clearRect(0, 0, 1, 1)
        probe.fillStyle = "#000"
        probe.fillStyle = css
        probe.fillRect(0, 0, 1, 1)
        const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data
        paint = a ? parseColor(`rgba(${r}, ${g}, ${b}, ${a / 255})`) : null
      }
    } catch {
      paint = null // a context that cannot read back: the colour is left out
    }
  }
  colorCache.set(css, paint)
  return paint
}

/** `top` over `under`, as one opaque colour. */
export function over(top: Paint, under: Paint): Paint {
  const ch = (h: string, i: number) => Number.parseInt(h.slice(1 + i * 2, 3 + i * 2), 16)
  const mix = [0, 1, 2].map((i) => Math.round(ch(top.hex, i) * top.alpha + ch(under.hex, i) * (1 - top.alpha)))
  return { hex: `#${mix.map((v) => v.toString(16).padStart(2, "0")).join("")}`, alpha: 1 }
}

export const withAlpha = (p: Paint, a: number): Paint => ({ hex: p.hex, alpha: p.alpha * a })

/* -------------------------------- geometry ------------------------------- */

export type Box = { x: number; y: number; w: number; h: number }

export function boxOf(r: { left: number; top: number; width: number; height: number }, k: Walk): Box {
  return { x: (r.left - k.ox) / k.zoom, y: (r.top - k.oy) / k.zoom, w: r.width / k.zoom, h: r.height / k.zoom }
}
export const outside = (b: Box, k: Walk) =>
  b.w <= 0 || b.h <= 0 || b.x >= k.w || b.y >= k.h || b.x + b.w <= 0 || b.y + b.h <= 0

/** Note what the reader approximated, once a kind, counted. */
export const note = (k: Walk, what: string) => k.notes.set(what, (k.notes.get(what) ?? 0) + 1)

/** The notes as the file's `<desc>` lists them. */
export const notesOf = (k: Walk): string[] => [...k.notes].map(([what, n]) => (n > 1 ? `${what} (${n})` : what))
