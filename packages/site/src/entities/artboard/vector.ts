// A drawn frame read into a vector picture (`svg.ts` writes it): the
// frame's surface on the canvas walked element by element at the canvas's
// zoom. A box's fill and edge is a rectangle, a line of text a `<text>` in
// its face, an inline SVG's shapes copied with their paints written on
// them, a canvas's print its cells merged into runs, one path an ink (a
// canvas with too many inks to be a print, a lit model, a shader's smooth
// ramp, a photo, is its current frame as a PNG `<image>`), an image its
// pixels. The layers are the frame's own: a chart's (grid, axes, series,
// legend, as the layer tree names them), a screen's rows and cells, a
// widget's component. Framework-free: it touches the page only when called.
import { layersOf } from "@/entities/chart"
import { componentEntry, type ScreenModel, screenLayers, type WidgetModel } from "@/entities/widget"
import type { Artboard } from "./model/types"
import { surfaceOf } from "./picture"
import {
  cellRuns,
  fontStack,
  inkPaint,
  type Paint,
  parseColor,
  quantizeInks,
  runsPath,
  type SvgFrame,
  type SvgNode,
  svgDocument,
  xmlText,
} from "./svg"

/** The attribute a renderer marks a layer of a frame with (a screen's row
 * or cell), its value the layer tree's id. Spread `layerMark(id)` on it. */
const LAYER_ATTR = "data-layer-id"
export const layerMark = (id: string): Record<string, string> => ({ [LAYER_ATTR]: id })

/** A layer's group, by the element it starts at. */
type Anchors = Map<Element, string>

type Walk = {
  /** The surface's top-left on the page and the canvas's zoom. */
  ox: number
  oy: number
  zoom: number
  /** The frame's box, for what lies wholly outside it. */
  w: number
  h: number
  anchors: Anchors
  defs: Map<string, string>
  /** What is left out with all it holds (the docs workbench's overlay). */
  skip?: (el: Element) => boolean
}

const SHAPES = new Set(["path", "line", "rect", "circle", "ellipse", "polyline", "polygon", "image"])
const PAINT_PROPS = [
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "opacity",
] as const
const DEF_TAGS = new Set(["linearGradient", "radialGradient", "pattern", "clipPath", "mask", "filter", "symbol"])

/* --------------------------------- colour -------------------------------- */

const colorCache = new Map<string, Paint | null>()
let probe: CanvasRenderingContext2D | null | undefined

/** Any CSS colour the page computes (`oklch()`, `color-mix()`'s `oklab()`,
 * `color(srgb …)`) as a paint: rgb and hex read here, the rest drawn on a
 * pixel and read back. Null for a clear colour. */
function paintOf(css: string): Paint | null {
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
function over(top: Paint, under: Paint): Paint {
  const ch = (h: string, i: number) => Number.parseInt(h.slice(1 + i * 2, 3 + i * 2), 16)
  const mix = [0, 1, 2].map((i) => Math.round(ch(top.hex, i) * top.alpha + ch(under.hex, i) * (1 - top.alpha)))
  return { hex: `#${mix.map((v) => v.toString(16).padStart(2, "0")).join("")}`, alpha: 1 }
}

const withAlpha = (p: Paint, a: number): Paint => ({ hex: p.hex, alpha: p.alpha * a })

/* -------------------------------- geometry ------------------------------- */

type Box = { x: number; y: number; w: number; h: number }

function boxOf(r: { left: number; top: number; width: number; height: number }, k: Walk): Box {
  return { x: (r.left - k.ox) / k.zoom, y: (r.top - k.oy) / k.zoom, w: r.width / k.zoom, h: r.height / k.zoom }
}
const outside = (b: Box, k: Walk) =>
  b.w <= 0 || b.h <= 0 || b.x >= k.w || b.y >= k.h || b.x + b.w <= 0 || b.y + b.h <= 0

/** The element's user space to the frame's px, as an SVG transform. */
function matrixOf(el: SVGGraphicsElement, k: Walk): string {
  const m = typeof el.getScreenCTM === "function" ? el.getScreenCTM() : null
  if (!m) return ""
  const f = (v: number) => Math.round(v * 1000) / 1000
  return `matrix(${f(m.a / k.zoom)} ${f(m.b / k.zoom)} ${f(m.c / k.zoom)} ${f(m.d / k.zoom)} ${f((m.e - k.ox) / k.zoom)} ${f((m.f - k.oy) / k.zoom)})`
}

/* ---------------------------------- walk --------------------------------- */

function group(name: string, children: SvgNode[]): SvgNode {
  return { t: "g", name, children }
}

/** Where an element's nodes go: a new group when it starts a layer (the
 * layer before it again when that has the same name: an axis drawn as
 * several parts is one layer), else where its parent's went. */
function layerOf(el: Element, k: Walk, out: SvgNode[]): SvgNode[] {
  const anchor = k.anchors.get(el)
  if (!anchor) return out
  const last = out[out.length - 1]
  if (last?.t === "g" && last.name === anchor && !last.filter) return last.children
  const g = { t: "g" as const, name: anchor, children: [] as SvgNode[] }
  out.push(g)
  return g.children
}

/** The element and what it holds, appended to `out` in paint order. */
function walkElement(el: Element, k: Walk, out: SvgNode[], alpha: number) {
  if (k.skip?.(el)) return
  const style = getComputedStyle(el)
  if (style.display === "none") return
  const opacity = Number.parseFloat(style.opacity || "1")
  if (opacity <= 0) return
  const a = alpha * (Number.isFinite(opacity) ? opacity : 1)
  // an inline SVG starts its own layer, if it is one, and walks its shapes
  if (el instanceof SVGElement) return svgNodes(el, k, out, alpha)
  const into = layerOf(el, k, out)
  const shown = style.visibility !== "hidden"
  if (el instanceof HTMLCanvasElement) {
    if (shown) canvasNodes(el, style, k, into, a)
    return
  }
  if (el instanceof HTMLImageElement) {
    if (shown) imageNode(el, style, k, into, a)
    return
  }
  if (shown) boxNodes(el, style, k, into, a)
  if (shown && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) fieldText(el, style, k, into, a)
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      if (shown) textNodes(child as Text, style, k, into, a)
    } else if (child instanceof Element) walkElement(child, k, into, a)
  }
}

/** A box's fill and its edge (one width and colour on every side: a stroke
 * inside it; otherwise each side its own bar). */
function boxNodes(el: Element, style: CSSStyleDeclaration, k: Walk, out: SvgNode[], a: number) {
  const fill = paintOf(style.backgroundColor)
  const sides = (["Top", "Right", "Bottom", "Left"] as const).map((s) => ({
    width: Number.parseFloat(style.getPropertyValue(`border-${s.toLowerCase()}-width`)) || 0,
    paint:
      style.getPropertyValue(`border-${s.toLowerCase()}-style`) === "none"
        ? null
        : paintOf(style.getPropertyValue(`border-${s.toLowerCase()}-color`)),
  }))
  const edged = sides.some((s) => s.width > 0 && s.paint)
  if (!fill && !edged) return
  const b = boxOf(el.getBoundingClientRect(), k)
  if (outside(b, k)) return
  const rx = Math.min(Number.parseFloat(style.borderTopLeftRadius) || 0, b.w / 2, b.h / 2)
  const same = sides.every((s) => s.width === sides[0].width && s.paint?.hex === sides[0].paint?.hex)
  if (fill) out.push({ t: "rect", ...b, rx, fill: withAlpha(fill, a) })
  if (!edged) return
  if (same && sides[0].paint) {
    const sw = sides[0].width
    out.push({
      t: "rect",
      x: b.x + sw / 2,
      y: b.y + sw / 2,
      w: Math.max(0, b.w - sw),
      h: Math.max(0, b.h - sw),
      rx: Math.max(0, rx - sw / 2),
      fill: null,
      stroke: { paint: withAlpha(sides[0].paint, a), width: sw },
    })
    return
  }
  const [t, r, bo, l] = sides
  const bars: [typeof t, Box][] = [
    [t, { x: b.x, y: b.y, w: b.w, h: t.width }],
    [r, { x: b.x + b.w - r.width, y: b.y, w: r.width, h: b.h }],
    [bo, { x: b.x, y: b.y + b.h - bo.width, w: b.w, h: bo.width }],
    [l, { x: b.x, y: b.y, w: l.width, h: b.h }],
  ]
  for (const [s, box] of bars)
    if (s.width > 0 && s.paint) out.push({ t: "rect", ...box, rx: 0, fill: withAlpha(s.paint, a) })
}

let metrics: CanvasRenderingContext2D | null | undefined
/** How far the face's baseline sits under the top of its line's box, and
 * that box's height, for a size: the face's own metrics, read once. */
function ascentOf(font: string): { ascent: number; height: number } | null {
  if (metrics === undefined) {
    try {
      metrics = document.createElement("canvas").getContext("2d")
    } catch {
      metrics = null
    }
  }
  if (!metrics) return null
  metrics.font = font
  const m = typeof metrics.measureText === "function" ? metrics.measureText("Hg") : null
  if (!m?.fontBoundingBoxAscent) return null
  return { ascent: m.fontBoundingBoxAscent, height: m.fontBoundingBoxAscent + m.fontBoundingBoxDescent }
}

const TRANSFORM: Record<string, (s: string) => string> = {
  uppercase: (s) => s.toUpperCase(),
  lowercase: (s) => s.toLowerCase(),
  capitalize: (s) => s.replace(/(^|\s)(\S)/g, (_, p, c: string) => p + c.toUpperCase()),
}

/** Past this a text is taken as one line at its box, not letter by letter. */
const MAX_LETTERS = 4000

/** A text node as one `<text>` a line, each where the page set it: the
 * letters read by a range, grouped into the lines they fell on. */
/** Type as the page sets it: the face (as a stack), its spacing, its case,
 * and where a line's baseline sits in the box the page gives its glyphs
 * (the face's content area, centred on its line). */
function typeOf(style: CSSStyleDeclaration) {
  const size = Number.parseFloat(style.fontSize) || 16
  const font = {
    family: fontStack(style.fontFamily || "sans-serif"),
    size,
    weight: style.fontWeight || "400",
    style: style.fontStyle || "normal",
  }
  const m = ascentOf(`${font.style} ${font.weight} ${size}px ${style.fontFamily}`)
  return {
    font,
    spacing: Number.parseFloat(style.letterSpacing) || 0,
    cased: TRANSFORM[style.textTransform] ?? ((s: string) => s),
    baseline: (top: number, height: number) => (m ? top + (height - m.height) / 2 + m.ascent : top + height * 0.8),
  }
}

/** An SVG `<text>` (a chart's tick) as text placed where it is drawn, its
 * anchor and baseline already resolved, which every tool reads alike. */
function svgText(el: SVGTextElement, style: CSSStyleDeclaration, k: Walk, out: SvgNode[], a: number) {
  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim()
  const fill = paintOf(style.fill)
  if (!text || !fill) return
  const t = typeOf(style)
  const b = boxOf(el.getBoundingClientRect(), k)
  const opacity = (Number.parseFloat(style.opacity) || 1) * (Number.parseFloat(style.fillOpacity) || 1)
  out.push({
    t: "text",
    x: b.x,
    y: t.baseline(b.y, b.h),
    text: t.cased(text),
    font: t.font,
    fill: withAlpha(fill, a * opacity),
    spacing: t.spacing,
  })
}

function textNodes(node: Text, style: CSSStyleDeclaration, k: Walk, out: SvgNode[], a: number) {
  const raw = node.data
  if (!raw.trim()) return
  const fill = paintOf(
    style.webkitTextFillColor && style.webkitTextFillColor !== style.color && paintOf(style.webkitTextFillColor)
      ? style.webkitTextFillColor
      : style.color,
  )
  if (!fill) return
  const { font, spacing, cased, baseline } = typeOf(style)
  const size = font.size
  const pre = /^pre/.test(style.whiteSpace)
  const range = document.createRange()
  const lines: { x: number; top: number; h: number; text: string }[] = []
  const letters = raw.length <= MAX_LETTERS && typeof range.getClientRects === "function"
  if (letters) {
    for (let i = 0; i < raw.length; i++) {
      range.setStart(node, i)
      range.setEnd(node, i + 1)
      const rects = range.getClientRects()
      const r = rects[0]
      const ch = raw[i]
      if (!r || (r.width === 0 && r.height === 0)) {
        // a collapsed space: it still parts the words on its line
        const last = lines[lines.length - 1]
        if (last && /\s/.test(ch) && !/\s$/.test(last.text)) last.text += " "
        continue
      }
      const b = boxOf(r, k)
      const last = lines[lines.length - 1]
      if (last && Math.abs(b.y - last.top) < Math.max(1, b.h / 2)) last.text += ch
      else if (/\s/.test(ch) && !pre) continue
      else lines.push({ x: b.x, top: b.y, h: b.h, text: ch })
    }
  } else {
    range.selectNodeContents(node)
    const r =
      typeof range.getBoundingClientRect === "function"
        ? range.getBoundingClientRect()
        : node.parentElement?.getBoundingClientRect()
    if (r) {
      const b = boxOf(r, k)
      lines.push({ x: b.x, top: b.y, h: b.h || size * 1.2, text: raw })
    }
  }
  for (const l of lines) {
    const text = cased(pre ? l.text.replace(/\s+$/, "") : l.text.replace(/\s+/g, " ").trim())
    if (!text) continue
    if (l.x >= k.w || l.top >= k.h) continue
    out.push({ t: "text", x: l.x, y: baseline(l.top, l.h), text, font, fill: withAlpha(fill, a), spacing })
  }
}

/** A blur and the page's blend, for a canvas a CSS filter softens (a
 * glow's layer). */
function filterOf(style: CSSStyleDeclaration, k: Walk): { filter?: string; blend?: string } {
  const f = style.filter
  const blur = Number(/blur\(([\d.]+)px\)/.exec(f)?.[1] ?? 0)
  const bright = Number(/brightness\(([\d.]+)\)/.exec(f)?.[1] ?? 1)
  const sat = Number(/saturate\(([\d.]+)\)/.exec(f)?.[1] ?? 1)
  const out: { filter?: string; blend?: string } = {}
  if (blur > 0 || bright !== 1 || sat !== 1) {
    const id = `glow-${[blur, bright, sat].join("-").replace(/\./g, "_")}`
    const steps = [
      blur > 0 ? `<feGaussianBlur stdDeviation="${blur}"/>` : "",
      bright !== 1
        ? `<feComponentTransfer>${["R", "G", "B"].map((c) => `<feFunc${c} type="linear" slope="${bright}"/>`).join("")}</feComponentTransfer>`
        : "",
      sat !== 1 ? `<feColorMatrix type="saturate" values="${sat}"/>` : "",
    ]
    k.defs.set(
      id,
      `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">${steps.join("")}</filter>`,
    )
    out.filter = id
  }
  if (style.mixBlendMode && style.mixBlendMode !== "normal") out.blend = style.mixBlendMode
  return out
}

/** A field's words, which are its value, not its text: the value, else
 * the placeholder in its own ink; one line centred in an input, the first
 * line under the padding in a textarea. */
function fieldText(
  el: HTMLInputElement | HTMLTextAreaElement,
  style: CSSStyleDeclaration,
  k: Walk,
  out: SvgNode[],
  a: number,
) {
  if (el instanceof HTMLInputElement && !FIELD_TYPES.has(el.type)) return
  const value = el.type === "password" ? "\u2022".repeat(el.value.length) : el.value
  const words = (value || el.placeholder).split("\n")[0]
  if (!words.trim()) return
  const ink = value ? style : getComputedStyle(el, "::placeholder")
  const fill = paintOf(ink.color)
  if (!fill) return
  const b = boxOf(el.getBoundingClientRect(), k)
  if (outside(b, k)) return
  const t = typeOf(style)
  const pad = (side: string) =>
    (Number.parseFloat(style.getPropertyValue(`padding-${side}`)) || 0) +
    (Number.parseFloat(style.getPropertyValue(`border-${side}-width`)) || 0)
  const line = Number.parseFloat(style.lineHeight) || t.font.size * 1.4
  const y = el instanceof HTMLTextAreaElement ? t.baseline(b.y + pad("top"), line) : t.baseline(b.y, b.h)
  out.push({
    t: "text",
    x: b.x + pad("left"),
    y,
    text: t.cased(words),
    font: t.font,
    fill: withAlpha(fill, a),
    spacing: t.spacing,
  })
}
const FIELD_TYPES = new Set(["text", "email", "password", "search", "tel", "url", "number", ""])

/** A canvas (or a pixelated image) as its cells (a print: few inks), else
 * its frame as a PNG. Pixels the page cannot read (another origin's) are
 * left out. */
function canvasNodes(
  cv: HTMLCanvasElement | HTMLImageElement,
  style: CSSStyleDeclaration,
  k: Walk,
  out: SvgNode[],
  a: number,
) {
  const w = cv instanceof HTMLImageElement ? cv.naturalWidth : cv.width
  const h = cv instanceof HTMLImageElement ? cv.naturalHeight : cv.height
  if (!w || !h) return
  const b = boxOf(cv.getBoundingClientRect(), k)
  if (outside(b, k)) return
  let copy: HTMLCanvasElement
  let data: Uint8ClampedArray
  try {
    copy = document.createElement("canvas")
    copy.width = w
    copy.height = h
    const ctx = copy.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    ctx.drawImage(cv, 0, 0)
    data = ctx.getImageData(0, 0, w, h).data
  } catch {
    return
  }
  const fx = filterOf(style, k)
  const inked = quantizeInks(data)
  const runs = inked && cellRuns(inked, w, h)
  const nodes: SvgNode[] = []
  if (runs) {
    for (const [ink, list] of runs)
      nodes.push({ t: "cells", d: runsPath(list, b.w / w, b.h / h, b.x, b.y), fill: inkPaint(ink) })
  } else nodes.push({ t: "image", ...b, href: copy.toDataURL("image/png"), fit: "none" })
  if (!nodes.length) return
  const g: SvgNode = { t: "g", name: fx.filter ? "Glow" : runs ? "Cells" : "Picture", children: nodes, ...fx }
  if (a < 1) g.opacity = a
  out.push(g)
}

const FIT: Record<string, string> = {
  cover: "xMidYMid slice",
  contain: "xMidYMid meet",
  fill: "none",
  "scale-down": "xMidYMid meet",
}

/** An image as its pixels (embedded, so the file stands alone), or its
 * address when the page may not read them; one drawn pixelated as cells. */
function imageNode(img: HTMLImageElement, style: CSSStyleDeclaration, k: Walk, out: SvgNode[], a: number) {
  if (!img.complete || !img.naturalWidth) return
  // An image drawn cell by cell (a still avatar or spinner) is a print.
  if (/pixelated|crisp-edges/.test(style.imageRendering)) return canvasNodes(img, style, k, out, a)
  const b = boxOf(img.getBoundingClientRect(), k)
  if (outside(b, k)) return
  let href = img.currentSrc || img.src
  try {
    const c = document.createElement("canvas")
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    c.getContext("2d")?.drawImage(img, 0, 0)
    href = c.toDataURL("image/png")
  } catch {
    // a picture of another origin: its address
  }
  const node: SvgNode = { t: "image", ...b, href, fit: FIT[style.objectFit] ?? "none" }
  out.push(a < 1 ? { t: "g", name: img.alt || "Image", opacity: a, children: [node] } : node)
}

/** An inline SVG's shapes, each copied with its paints as the page
 * computes them and its place in the frame as a matrix; what they refer to
 * (gradients, symbols a `<use>` draws) goes into the file's defs. */
function svgNodes(el: SVGElement, k: Walk, out: SvgNode[], alpha: number) {
  const tag = el.localName
  if (DEF_TAGS.has(tag) || tag === "defs") {
    if (tag !== "defs" && el.id) k.defs.set(el.id, resolvedMarkup(el, alpha, true))
    else for (const c of el.children) if (c instanceof SVGElement) svgNodes(c, k, out, alpha)
    return
  }
  const style = getComputedStyle(el)
  if (style.display === "none") return
  const into = layerOf(el, k, out)
  if (tag === "use") {
    const ref = (el.getAttribute("href") ?? el.getAttribute("xlink:href") ?? "").replace(/^#/, "")
    const target = ref ? el.ownerDocument.getElementById(ref) : null
    if (target instanceof SVGElement && !k.defs.has(ref)) k.defs.set(ref, resolvedMarkup(target, 1, true, style.color))
    if (style.visibility !== "hidden" && target)
      into.push({
        t: "shape",
        markup: `<g transform="${matrixOf(el as SVGGraphicsElement, k)}">${shapeMarkup(el, style, alpha)}</g>`,
      })
    return
  }
  if (tag === "text") {
    if (style.visibility !== "hidden") svgText(el as SVGTextElement, style, k, into, alpha)
    return
  }
  if (SHAPES.has(tag)) {
    if (style.visibility === "hidden") return
    into.push({
      t: "shape",
      markup: `<g transform="${matrixOf(el as SVGGraphicsElement, k)}">${shapeMarkup(el, style, alpha)}</g>`,
    })
    return
  }
  for (const c of el.children)
    if (c instanceof SVGElement) svgNodes(c, k, into, alpha * (Number.parseFloat(style.opacity) || 1))
}

/** The computed paints of an SVG element as attributes, its colours read
 * as hex (a design tool knows neither `currentColor` nor `oklch()`). */
function paintAttrs(style: CSSStyleDeclaration, alpha: number): string {
  let s = ""
  for (const p of PAINT_PROPS) {
    let v = style.getPropertyValue(p).trim()
    if (!v) continue
    if (p === "fill" || p === "stroke") {
      if (v.startsWith("url(")) {
        v = v.replace(/^url\("?(?:[^#"]*)?(#[^")]+)"?\)$/, "url($1)")
        s += ` ${p}="${xmlText(v)}"`
        continue
      }
      const paint = v === "none" ? null : paintOf(v)
      s += paint
        ? ` ${p}="${paint.hex}"${paint.alpha < 1 ? ` ${p}-opacity="${Math.round(paint.alpha * 1000) / 1000}"` : ""}`
        : ` ${p}="none"`
      continue
    }
    if (p === "fill-opacity" || p === "stroke-opacity") continue
    if (p === "opacity") {
      const o = (Number.parseFloat(v) || 1) * alpha
      if (o < 1) s += ` opacity="${Math.round(o * 1000) / 1000}"`
      continue
    }
    if (/^-?[\d.]+px$/.test(v)) v = v.slice(0, -2)
    if ((p === "stroke-dasharray" && v === "none") || v === "normal" || v === "auto") continue
    s += ` ${p}="${xmlText(v)}"`
  }
  return s
}

const GEOMETRY =
  /^(d|x|y|x1|x2|y1|y2|cx|cy|r|rx|ry|width|height|points|transform|href|xlink:href|viewBox|preserveAspectRatio|pathLength|gradientUnits|gradientTransform|offset|stop-color|stop-opacity|fx|fy|patternUnits|patternTransform|id|spreadMethod)$/

/** One SVG element as markup: its geometry attributes, its computed paints
 * (on a shape) and, for text, its text. */
function shapeMarkup(el: Element, style: CSSStyleDeclaration, alpha: number): string {
  const attrs = [...el.attributes]
    .filter((at) => GEOMETRY.test(at.name) && at.name !== "transform" && at.name !== "id")
    .map((at) => ` ${at.name}="${xmlText(at.value)}"`)
    .join("")
  return `<${el.localName}${attrs}${paintAttrs(style, alpha)}/>`
}

/** A referenced element (a gradient, a symbol) whole, as markup: geometry
 * kept, `currentColor` written as the colour of what draws it. */
function resolvedMarkup(el: Element, alpha: number, keepId: boolean, color?: string): string {
  const tag = el.localName
  const attrs = [...el.attributes]
    .filter((at) => GEOMETRY.test(at.name) && (keepId || at.name !== "id"))
    .map((at) => ` ${at.name}="${xmlText(at.value)}"`)
    .join("")
  const current = color ? paintOf(color) : null
  const paint = [...el.attributes]
    .filter((at) => ["fill", "stroke", "stroke-width", "stop-color", "opacity"].includes(at.name))
    .map((at) => ` ${at.name}="${xmlText(at.value === "currentColor" && current ? current.hex : at.value)}"`)
    .join("")
  const kids = [...el.childNodes]
    .map((c) =>
      c instanceof Element
        ? resolvedMarkup(c, alpha, false, color)
        : c.nodeType === Node.TEXT_NODE
          ? xmlText(c.textContent ?? "")
          : "",
    )
    .join("")
  return `<${tag}${attrs}${paint}${kids ? `>${kids}</${tag}>` : "/>"}`
}

/* --------------------------------- layers -------------------------------- */

/** A widget's one layer: the component's label, or its kind's. */
function widgetName(w: WidgetModel): string {
  if (w.kind === "component") return componentEntry(w.is)?.label ?? w.is
  return w.kind[0].toUpperCase() + w.kind.slice(1)
}

/** A screen's rows and cells, by the marks its renderer set. */
function screenAnchors(screen: ScreenModel, a: Artboard, surface: Element, anchors: Anchors) {
  const names = new Map(screenLayers(screen, a.id).map((l) => [l.id, l.label]))
  for (const el of surface.querySelectorAll(`[${LAYER_ATTR}]`)) {
    const name = names.get(el.getAttribute(LAYER_ATTR) ?? "")
    if (name) anchors.set(el, name)
  }
}

/** A chart's layers as the layer tree names them: the chart's back SVG is
 * its grid (a polar chart's frame), its canvases its series (one series:
 * by its name), the parts of its front SVG the axes (by where they stand:
 * under the plot, the X axis; left of it, the Y axis) or the series'
 * markers, and what it lays over them in the page its legend. */
function chartAnchors(a: Artboard, surface: Element, k: Walk, anchors: Anchors) {
  const names = new Map(layersOf(a.chart, a.id).map((l) => [l.kind, l.label]))
  const shown = a.chart.series.filter((s) => s.on)
  const series = shown.length === 1 ? shown[0].label : "Series"
  const first = surface.querySelector("svg, canvas")
  const root = first?.parentElement
  if (!root) return
  anchors.set(root, names.get("root") ?? "Chart")
  const m = a.chart.margins
  for (const child of root.children) {
    if (child instanceof SVGSVGElement && child.getAttribute("aria-hidden") === "true")
      anchors.set(child, names.get("grid") ?? "Frame")
    else if (child instanceof SVGSVGElement) {
      const box = boxOf(child.getBoundingClientRect(), k)
      const left = box.x + m.left
      const bottom = box.y + box.h - m.bottom
      for (const part of child.firstElementChild?.children ?? []) {
        const r = boxOf(part.getBoundingClientRect(), k)
        const placed = r.w > 0 && r.h > 0
        const name =
          placed && names.has("xAxis") && r.y >= bottom - 1
            ? names.get("xAxis")
            : placed && names.has("yAxis") && r.x + r.w <= left + 1
              ? names.get("yAxis")
              : `${series} markers`
        anchors.set(part, name ?? "Part")
      }
    } else if (child instanceof HTMLCanvasElement || child.querySelector("canvas")) anchors.set(child, series)
    else anchors.set(child, names.get("legend") ?? "Legend")
  }
}

/* -------------------------------- the frame ------------------------------ */

/** The opaque colour the page shows under an element: the first ancestor
 * with a ground, else white. */
function groundOf(el: Element): Paint {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const g = paintOf(getComputedStyle(p).backgroundColor)
    if (g && g.alpha >= 1) return g
  }
  return { hex: "#ffffff", alpha: 1 }
}

/** The ground a surface stands on, as the page shows it (its own fill
 * over what is under it), with its corner. */
function groundNode(surface: Element, w: number, h: number): SvgNode {
  const style = getComputedStyle(surface)
  const fill = paintOf(style.backgroundColor)
  const under = groundOf(surface)
  const rx = Math.min(Number.parseFloat(style.borderTopLeftRadius) || 0, w / 2, h / 2)
  return {
    t: "g",
    name: "Background",
    children: [{ t: "rect", x: 0, y: 0, w, h, rx, fill: fill ? over(fill, under) : under }],
  }
}

/** A frame as drawn, read into one frame of a picture, or null when it is
 * not on the page. Its ground is the surface's fill as the page shows it
 * (over the canvas), its content one group a layer. */
function frameOf(a: Artboard, x = 0, y = 0, defs = new Map<string, string>()): SvgFrame | null {
  const surface = surfaceOf(a.id)
  if (!surface) return null
  const r = surface.getBoundingClientRect()
  const zoom = r.width > 0 && a.w > 0 ? r.width / a.w : 1
  const k: Walk = { ox: r.left, oy: r.top, zoom, w: a.w, h: a.h, anchors: new Map(), defs }
  const w = a.widget
  if (!w) chartAnchors(a, surface, k, k.anchors)
  else if (w.kind === "screen") screenAnchors(w, a, surface, k.anchors)
  const content: SvgNode[] = []
  for (const child of surface.children) walkElement(child, k, content, 1)
  // A widget is one layer under the frame, named after its component.
  const body = w && w.kind !== "screen" ? [group(widgetName(w), content)] : content
  return {
    name: a.name,
    x,
    y,
    w: a.w,
    h: a.h,
    clip: true,
    nodes: [groundNode(surface, a.w, a.h), ...body],
  }
}

/**
 * Any element as drawn, as one SVG file its size: its ground, then what it
 * holds, read as a frame is (the docs previews' Copy as SVG). `skip` leaves
 * out an element with all it holds (the workbench's own overlay). Null
 * when it is not laid out.
 */
export function elementSvg(root: Element, name: string, skip?: (el: Element) => boolean): string | null {
  const r = root.getBoundingClientRect()
  if (!(r.width > 0 && r.height > 0)) return null
  const defs = new Map<string, string>()
  const k: Walk = { ox: r.left, oy: r.top, zoom: 1, w: r.width, h: r.height, anchors: new Map(), defs, skip }
  const content: SvgNode[] = []
  for (const child of root.children) walkElement(child, k, content, 1)
  const frame: SvgFrame = {
    name,
    x: 0,
    y: 0,
    w: r.width,
    h: r.height,
    clip: true,
    nodes: [groundNode(root, r.width, r.height), ...content],
  }
  return svgDocument([frame], r.width, r.height, [...defs.values()])
}

/**
 * Frames as one SVG file: a lone frame at its own size; several at their
 * places on the canvas, the picture as large as the box around them. Null
 * when a frame is not drawn on the page (hidden, or the Studio not open).
 */
export function framesSvg(frames: Artboard[]): string | null {
  if (!frames.length) return null
  const x0 = Math.min(...frames.map((a) => a.x))
  const y0 = Math.min(...frames.map((a) => a.y))
  const defs = new Map<string, string>()
  const read: SvgFrame[] = []
  for (const a of frames) {
    const f = frames.length === 1 ? frameOf(a, 0, 0, defs) : frameOf(a, a.x - x0, a.y - y0, defs)
    if (!f) return null
    read.push(f)
  }
  const w = Math.max(...read.map((f) => f.x + f.w))
  const h = Math.max(...read.map((f) => f.y + f.h))
  return svgDocument(read, w, h, [...defs.values()])
}
