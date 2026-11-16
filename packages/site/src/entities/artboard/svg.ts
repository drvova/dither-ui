// A frame as a vector picture: the scene a design tool keeps editing (one
// group a layer, named after it; text as text; shapes as shapes; the dither
// as cells merged into runs, one path an ink) and the SVG file it is
// written as. Framework-free: `vector.ts` reads a drawn frame into a scene,
// this module writes any scene, so its rules are tested without a browser.
import { num, type Radii, roundedPath, uniformRadii } from "./css-svg"

/** A colour as a design tool takes it: `#rrggbb` and its alpha apart. */
export type Paint = { hex: string; alpha: number }

/** A font as the frame sets it, its family a stack the tools can resolve. */
type Font = { family: string; size: number; weight: string; style: string }

/** What a picture is made of. A group carries its layer's name. */
export type SvgNode =
  | {
      t: "g"
      name: string
      opacity?: number
      filter?: string
      blend?: string
      /** A `<clipPath>` in the defs (overflow, a CSS `clip-path`). */
      clip?: string
      children: SvgNode[]
    }
  /** A box: `rx` on every corner, or `radii` each its own; its fill a paint
   * or a gradient or pattern in the defs (`ref`). */
  | {
      t: "rect"
      x: number
      y: number
      w: number
      h: number
      rx: number
      radii?: Radii
      fill: Paint | null
      ref?: string
      stroke?: Stroke
    }
  /** A line of text; `ref`, a gradient in the defs, paints it where the
   * page clips a background to the glyphs. */
  | { t: "text"; x: number; y: number; text: string; font: Font; fill: Paint; ref?: string; spacing: number }
  | { t: "cells"; d: string; fill: Paint }
  | { t: "image"; x: number; y: number; w: number; h: number; href: string; fit: string }
  /** An element of an inline SVG, copied with its paints written on it. */
  | { t: "shape"; markup: string }

type Stroke = { paint: Paint; width: number }

/** A cell run: `w` cells wide, `h` rows tall, from cell `x`, `y`. */
type Run = { x: number; y: number; w: number; h: number }

/** Past this many inks a canvas is a picture (a photo, a lit model, a
 * shader's smooth ramp), not a print: it is embedded as an image. */
const MAX_INKS = 48
/** Past this many runs the cells would weigh more than the picture. */
const MAX_RUNS = 40_000

/**
 * The cells of an RGBA raster merged into runs, per ink: each row's
 * stretches of one colour, and a stretch that repeats exactly in the rows
 * under it taken as one taller run. Clear cells are none. An ink is the
 * packed `rgba` of its cells. Null when the raster holds more than
 * `maxInks` inks or more than `maxRuns` runs.
 */
export function cellRuns(
  data: ArrayLike<number>,
  w: number,
  h: number,
  maxInks = MAX_INKS,
  maxRuns = MAX_RUNS,
): Map<number, Run[]> | null {
  const out = new Map<number, Run[]>()
  // Runs still open from the row above, by ink, x and width.
  let open = new Map<string, Run>()
  let runs = 0
  for (let y = 0; y < h; y++) {
    const next = new Map<string, Run>()
    let x = 0
    while (x < w) {
      const i = (y * w + x) * 4
      const a = data[i + 3]
      if (!a) {
        x++
        continue
      }
      const ink = ((data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | a) >>> 0
      let end = x + 1
      while (end < w) {
        const j = (y * w + end) * 4
        if (data[j] !== data[i] || data[j + 1] !== data[i + 1] || data[j + 2] !== data[i + 2] || data[j + 3] !== a)
          break
        end++
      }
      const key = `${ink}:${x}:${end - x}`
      const above = open.get(key)
      if (above) above.h++
      else {
        let list = out.get(ink)
        if (!list) {
          if (out.size >= maxInks) return null
          out.set(ink, (list = []))
        }
        if (++runs > maxRuns) return null
        const run = { x, y, w: end - x, h: 1 }
        list.push(run)
        next.set(key, run)
      }
      if (above) next.set(key, above)
      x = end
    }
    open = next
  }
  return out
}

/** How far a cell may move from its own colour into the print's inks (RMS,
 * 0-255, the colour as it shows, alpha applied). Past it the art is no print. */
const INK_TOLERANCE = 12

type Swatch = { key: number; shown: number[]; count: number }

/**
 * A raster held to at most `maxInks` inks, so its cells merge into runs: a
 * canvas reads back with each cell's colour a hair off its ink (its alpha
 * stored premultiplied) and a print's tones as many alphas. Every colour is
 * first read to 6 bits a channel and 16 alphas (the ones under 1/32 clear),
 * then the colours, as they show (alpha applied), are cut at their median
 * along their widest spread into `maxInks` boxes (a line's few cells of
 * its own hue keep a box of their own), each box one ink: its cells' mean.
 * Null when that moves the cells further than `tolerance` on average (a
 * photo, a smooth ramp): no print.
 */
export function quantizeInks(
  data: ArrayLike<number>,
  maxInks = MAX_INKS,
  tolerance = INK_TOLERANCE,
): Uint8ClampedArray | null {
  const n = data.length / 4
  const keyOf = new Int32Array(n).fill(-1)
  const swatches = new Map<number, Swatch>()
  for (let p = 0; p < n; p++) {
    const i = p * 4
    const a = Math.round(data[i + 3] / 17)
    if (!a) continue
    const key = (((data[i] >> 2) << 18) | ((data[i + 1] >> 2) << 12) | ((data[i + 2] >> 2) << 6)) * 16 + a
    keyOf[p] = key
    const s = swatches.get(key)
    if (s) s.count++
    else {
      const al = a * 17
      const ch = [data[i] >> 2, data[i + 1] >> 2, data[i + 2] >> 2].map((c) => ((c * 4 + 2) * al) / 255)
      swatches.set(key, { key, shown: [...ch, al], count: 1 })
    }
  }
  // Median cut: the box with the widest spread is cut at its weighted median.
  const spread = (box: Swatch[]) => {
    let best = 0
    let dim = 0
    for (let d = 0; d < 4; d++) {
      let lo = 255
      let hi = 0
      for (const s of box) {
        lo = Math.min(lo, s.shown[d])
        hi = Math.max(hi, s.shown[d])
      }
      if (hi - lo > best) {
        best = hi - lo
        dim = d
      }
    }
    return { best, dim }
  }
  const boxes: Swatch[][] = swatches.size ? [[...swatches.values()]] : []
  while (boxes.length < maxInks) {
    let pick = -1
    let widest = 0
    boxes.forEach((b, i) => {
      if (b.length < 2) return
      const w = spread(b).best
      if (w > widest) {
        widest = w
        pick = i
      }
    })
    if (pick < 0) break
    const box = boxes[pick]
    const { dim } = spread(box)
    box.sort((x, y) => x.shown[dim] - y.shown[dim])
    const half = box.reduce((t, s) => t + s.count, 0) / 2
    let cut = 0
    for (let seen = 0; cut < box.length - 1 && seen + box[cut].count <= half; cut++) seen += box[cut].count
    cut = Math.max(1, Math.min(box.length - 1, cut))
    boxes.splice(pick, 1, box.slice(0, cut), box.slice(cut))
  }
  // Each box's ink, its cells' mean as it shows, written back straight.
  const ink = new Map<number, number[]>()
  let err = 0
  let total = 0
  for (const box of boxes) {
    const weight = box.reduce((t, s) => t + s.count, 0)
    const mean = [0, 1, 2, 3].map((d) => box.reduce((t, s) => t + s.shown[d] * s.count, 0) / weight)
    const a = Math.max(1, Math.round(mean[3]))
    const rgba = [...mean.slice(0, 3).map((c) => Math.round(Math.min(255, (c * 255) / a))), a]
    for (const s of box) {
      ink.set(s.key, rgba)
      err += (s.shown.reduce((t, v, d) => t + (v - mean[d]) ** 2, 0) / 4) * s.count
      total += s.count
    }
  }
  if (total && Math.sqrt(err / total) > tolerance) return null
  const out = new Uint8ClampedArray(n * 4)
  for (let p = 0; p < n; p++) if (keyOf[p] >= 0) out.set(ink.get(keyOf[p])!, p * 4)
  return out
}

/** The packed ink's paint. */
export const inkPaint = (ink: number): Paint => ({
  hex: `#${(ink >>> 8).toString(16).padStart(6, "0")}`,
  alpha: (ink & 255) / 255,
})

/** Runs as one path: a closed rectangle a run, each cell `cw` by `ch` px,
 * the raster's origin at `ox`, `oy`. */
export function runsPath(runs: Run[], cw: number, ch: number, ox: number, oy: number): string {
  let d = ""
  for (const r of runs)
    d += `M${num(ox + r.x * cw)} ${num(oy + r.y * ch)}h${num(r.w * cw)}v${num(r.h * ch)}h${num(-r.w * cw)}z`
  return d
}

/** A CSS colour as a paint: `rgb()`/`rgba()` (either syntax) and hex; null
 * for anything else (a browser reads those through `vector.ts`) and for a
 * colour that is fully clear. */
export function parseColor(css: string): Paint | null {
  const s = css.trim().toLowerCase()
  const hex = /^#([0-9a-f]{3,8})$/.exec(s)?.[1]
  if (hex) {
    const full = hex.length <= 4 ? [...hex].map((c) => c + c).join("") : hex
    const alpha = full.length === 8 ? Number.parseInt(full.slice(6), 16) / 255 : 1
    return alpha > 0 ? { hex: `#${full.slice(0, 6)}`, alpha } : null
  }
  const m = /^rgba?\(([^)]*)\)$/.exec(s)
  if (!m) return null
  const parts = m[1].split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3) return null
  const ch = parts.slice(0, 3).map((p) => (p.endsWith("%") ? (Number.parseFloat(p) * 255) / 100 : Number(p)))
  if (ch.some((v) => !Number.isFinite(v))) return null
  const a = parts[3] === undefined ? 1 : parts[3].endsWith("%") ? Number.parseFloat(parts[3]) / 100 : Number(parts[3])
  if (!(a > 0)) return null
  const byte = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0")
  return { hex: `#${ch.map(byte).join("")}`, alpha: Math.min(1, a) }
}

/** The faces a design tool most likely has (Figma ships Google's fonts),
 * set first in a stack; the frame's own faces follow. Michroma is the
 * display face, Inter the kit's sans, JetBrains Mono the stand-in for the
 * system mono the kit asks for first. */
const PORTABLE = ["Michroma", "Inter", "JetBrains Mono"]
/** CSS's system keywords, which no design tool resolves. */
const SYSTEM = new Set(["ui-monospace", "ui-sans-serif", "ui-serif", "ui-rounded", "system-ui", "-apple-system"])
/** The generic that closes each stack, from the keyword that opened it. */
const GENERIC: Record<string, string> = { "ui-monospace": "monospace", "ui-sans-serif": "sans-serif" }

/** A computed `font-family` as a stack for a file: the system keywords out,
 * a portable face the stack names moved to its front, a mono stack given
 * JetBrains Mono when it names no portable face, and a generic at its end. */
export function fontStack(family: string): string {
  const names = family
    .split(",")
    .map((f) => f.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean)
  const generic =
    names.find((n) => ["monospace", "sans-serif", "serif"].includes(n)) ??
    names.map((n) => GENERIC[n]).find(Boolean) ??
    "sans-serif"
  const kept = names.filter((n) => !SYSTEM.has(n) && n !== generic)
  const portable = kept.filter((n) => PORTABLE.includes(n))
  if (!portable.length && generic === "monospace") portable.push("JetBrains Mono")
  const stack = [...portable, ...kept.filter((n) => !portable.includes(n)), generic]
  return stack.map((n) => (/^[\w-]+$/.test(n) && n === generic ? n : `'${n.replace(/'/g, "")}'`)).join(", ")
}

/** Text as XML text: the five escapes, and no character XML forbids. */
export function xmlText(s: string): string {
  return s
    .replace(/[^\t\n\r -퟿-�\u{10000}-\u{10FFFF}]/gu, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

const fillAttrs = (p: Paint | null, kind = "fill"): string =>
  p ? ` ${kind}="${p.hex}"${p.alpha < 1 ? ` ${kind}-opacity="${num(p.alpha)}"` : ""}` : ` ${kind}="none"`

/** Layer names as ids, which design tools read as the layer's name: each
 * name once (a repeat takes a number), no character an attribute breaks on. */
function namer(): (name: string) => string {
  const seen = new Map<string, number>()
  return (name) => {
    const base =
      [...name]
        .map((c) => (c.charCodeAt(0) < 32 ? " " : c))
        .join("")
        .replace(/\s+/g, " ")
        .trim() || "Layer"
    const n = (seen.get(base) ?? 0) + 1
    seen.set(base, n)
    return n === 1 ? base : `${base} ${n}`
  }
}

function writeNode(node: SvgNode, id: (name: string) => string, pad: string): string {
  switch (node.t) {
    case "g": {
      const name = id(node.name)
      const attrs = `id="${xmlText(name)}" data-name="${xmlText(node.name)}"${node.opacity !== undefined && node.opacity < 1 ? ` opacity="${num(node.opacity)}"` : ""}${node.filter ? ` filter="url(#${node.filter})"` : ""}${node.clip ? ` clip-path="url(#${node.clip})"` : ""}${node.blend ? ` style="mix-blend-mode:${node.blend}"` : ""}`
      if (!node.children.length) return `${pad}<g ${attrs}/>`
      return `${pad}<g ${attrs}>\n${node.children.map((c) => writeNode(c, id, `${pad}  `)).join("\n")}\n${pad}</g>`
    }
    case "rect": {
      const s = node.stroke
      const paint = `${node.ref ? ` fill="url(#${node.ref})"` : fillAttrs(node.fill)}${s ? `${fillAttrs(s.paint, "stroke")} stroke-width="${num(s.width)}"` : ""}`
      const r = node.radii
      if (r && !uniformRadii(r)) return `${pad}<path d="${roundedPath(node, r)}"${paint}/>`
      const [rx, ry] = r ? r[0] : [node.rx, node.rx]
      return `${pad}<rect x="${num(node.x)}" y="${num(node.y)}" width="${num(node.w)}" height="${num(node.h)}"${rx > 0 && ry > 0 ? ` rx="${num(rx)}"${ry !== rx ? ` ry="${num(ry)}"` : ""}` : ""}${paint}/>`
    }
    case "text": {
      const f = node.font
      return `${pad}<text x="${num(node.x)}" y="${num(node.y)}" font-family="${xmlText(f.family)}" font-size="${num(f.size)}"${f.weight !== "400" && f.weight !== "normal" ? ` font-weight="${xmlText(f.weight)}"` : ""}${f.style !== "normal" ? ` font-style="${xmlText(f.style)}"` : ""}${node.spacing ? ` letter-spacing="${num(node.spacing)}"` : ""}${node.ref ? ` fill="url(#${node.ref})"` : fillAttrs(node.fill)} xml:space="preserve">${xmlText(node.text)}</text>`
    }
    case "cells":
      return `${pad}<path d="${node.d}"${fillAttrs(node.fill)} shape-rendering="crispEdges"/>`
    case "image":
      return `${pad}<image x="${num(node.x)}" y="${num(node.y)}" width="${num(node.w)}" height="${num(node.h)}" preserveAspectRatio="${node.fit}" href="${xmlText(node.href)}"/>`
    case "shape":
      return `${pad}${node.markup}`
  }
}

/** One frame of a picture: its name, its place in the picture, its size,
 * whether its content is clipped to it, and what it holds. */
export type SvgFrame = { name: string; x: number; y: number; w: number; h: number; clip: boolean; nodes: SvgNode[] }

/**
 * The picture as an SVG file, `w` by `h` px: each frame a group named after
 * it at its place (clipped to its box when it asks), `defs` (filters,
 * gradients, patterns and clips the nodes refer to) written once before
 * them, and `notes`, what the reader approximated, as its `<desc>`.
 */
export function svgDocument(
  frames: SvgFrame[],
  w: number,
  h: number,
  defs: string[] = [],
  notes: string[] = [],
): string {
  const id = namer()
  const clips: string[] = []
  const body = frames.map((f, i) => {
    const clipId = `frame-clip-${i + 1}`
    if (f.clip) clips.push(`<clipPath id="${clipId}"><rect width="${num(f.w)}" height="${num(f.h)}"/></clipPath>`)
    const name = id(f.name)
    const at = f.x || f.y ? ` transform="translate(${num(f.x)} ${num(f.y)})"` : ""
    const inner = f.nodes.map((n) => writeNode(n, id, "    ")).join("\n")
    const content = f.clip ? `  <g clip-path="url(#${clipId})">\n${inner}\n  </g>` : inner.replace(/^ {2}/gm, "")
    return `<g id="${xmlText(name)}" data-name="${xmlText(f.name)}"${at}>\n${content}\n</g>`
  })
  const allDefs = [...clips, ...defs]
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${num(w)}" height="${num(h)}" viewBox="0 0 ${num(w)} ${num(h)}" fill="none">`,
    ...(notes.length ? [`<desc>${xmlText(`Approximated from the page: ${notes.join("; ")}.`)}</desc>`] : []),
    ...(allDefs.length ? [`<defs>\n${allDefs.join("\n")}\n</defs>`] : []),
    ...body,
    "</svg>",
    "",
  ].join("\n")
}
