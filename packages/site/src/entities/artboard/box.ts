// A box as the page paints it, read for the frame reader (`vector.ts`):
// outer shadows, its fill and each background layer (a linear or radial
// gradient as an SVG gradient, a tiled layer as a pattern, the kit's tone
// classes as the tone's own pattern from `tonePatterns`), inset rings (a
// pressed key's), its border and outline, each corner its own radius; the
// clip its `clip-path` or overflow sets; a positioned `::before`/`::after`
// as a box; a control the browser draws (a checkbox, a radio, a slider)
// as plain shapes. What SVG cannot say is noted for the file's `<desc>`.
// Touches the page only when called.
import { SCREEN_KINDS, screenTone, TONE_LEVELS, tonePatterns, toneTile } from "@dither-ui/kit/engine"
import {
  clipShape,
  gradientDef,
  insetRadii,
  num,
  type Radii,
  radiiOf,
  roundedPath,
  shadowsOf,
  splitTop,
  tileOf,
} from "./css-svg"
import type { Paint, SvgNode } from "./svg"
import { type Box, boxOf, note, outside, paintOf, type Walk, withAlpha } from "./walk"

const px = (v: string) => Number.parseFloat(v) || 0
const none = (v: string | undefined) => !v || v === "none" || v === "normal" || v === "auto"
type Sides = [number, number, number, number]

/** A def's id, unique in the file (every frame of a picture shares one map). */
const defId = (k: Walk, kind: string) => `${kind}-${k.defs.size + 1}`

const radiiFor = (style: CSSStyleDeclaration, b: Box): Radii =>
  radiiOf(
    [
      style.borderTopLeftRadius,
      style.borderTopRightRadius,
      style.borderBottomRightRadius,
      style.borderBottomLeftRadius,
    ],
    b.w,
    b.h,
  )

const inset = (b: Box, [t, r, bo, l]: Sides): Box => ({
  x: b.x + l,
  y: b.y + t,
  w: Math.max(0, b.w - l - r),
  h: Math.max(0, b.h - t - bo),
})

const SIDE_NAMES = ["top", "right", "bottom", "left"] as const

/* ---------------------------------- tones --------------------------------- */

let tones: Map<string, string> | undefined
/** Each tone's tile as a page computes it (`--dk-tone-tile`) to its cells
 * as `tonePatterns` draws them: the kit's own tiles, never derived here. */
function toneCells(tile: string): string | null {
  if (!tones) {
    tones = new Map()
    const drawn = new Map<string, string>()
    for (const m of tonePatterns(1).matchAll(/<pattern id="([^"]+)"[^>]*>(?:<path [^>]* d="([^"]*)"\/>)?<\/pattern>/g))
      drawn.set(m[1], m[2] ?? "")
    for (const screen of SCREEN_KINDS)
      for (let level = 0; level < TONE_LEVELS; level++)
        tones.set(toneTile(screenTone(screen, level)), drawn.get(`dk-${screen}-${level}`) ?? "")
  }
  return tones.get(tile.trim()) ?? null
}

/** A tone layer (`dk-tone*`): its lit cells in its ink as a pattern, laid
 * from the box at `--dk-cell`, moved `--dk-tone-x`/`-y` cells. Null when
 * the element prints no tone of the kit's. */
function toneNode(el: Element, style: CSSStyleDeclaration, b: Box, radii: Radii, k: Walk, a: number): SvgNode | null {
  const cells = toneCells(style.getPropertyValue("--dk-tone-tile"))
  if (cells === null) return null
  if (el.classList.contains("dk-tone-gaps") || el.classList.contains("dk-tone-hatch"))
    note(k, "a tone's gaps or hatch, drawn as its tone")
  const ink = paintOf(style.backgroundColor)
  if (!ink || !cells) return { t: "g", name: "Tone", children: [] }
  const cell = px(style.getPropertyValue("--dk-cell")) || 2
  const sx = px(style.getPropertyValue("--dk-tone-x"))
  const sy = px(style.getPropertyValue("--dk-tone-y"))
  const id = defId(k, "tone")
  const p = withAlpha(ink, a)
  k.defs.set(
    id,
    `<pattern id="${id}" x="${num(b.x + sx * cell)}" y="${num(b.y + sy * cell)}" width="${num(4 * cell)}" height="${num(4 * cell)}" patternUnits="userSpaceOnUse"><path transform="scale(${num(cell)})" fill="${p.hex}"${p.alpha < 1 ? ` fill-opacity="${num(p.alpha)}"` : ""} shape-rendering="crispEdges" d="${cells}"/></pattern>`,
  )
  return { t: "rect", ...b, rx: 0, radii, fill: null, ref: id }
}

/* ---------------------------- background layers --------------------------- */

const intersect = (a: Box, b: Box): Box => {
  const x = Math.max(a.x, b.x)
  const y = Math.max(a.y, b.y)
  return {
    x,
    y,
    w: Math.max(0, Math.min(a.x + a.w, b.x + b.w) - x),
    h: Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y),
  }
}

/** The background image layers over `area`, the bottom one first: a
 * gradient drawn once over its tile, a repeating layer as a pattern, a
 * conic gradient in its first colour. */
function layers(style: CSSStyleDeclaration, area: Box, radii: Radii, k: Walk, a: number): SvgNode[] {
  if (none(style.backgroundImage)) return []
  const images = splitTop(style.backgroundImage)
  const sizes = splitTop(style.backgroundSize || "auto")
  const positions = splitTop(style.backgroundPosition || "0% 0%")
  const repeats = splitTop(style.backgroundRepeat || "repeat")
  const out: SvgNode[] = []
  for (let i = images.length - 1; i >= 0; i--) {
    const image = images[i]
    if (none(image)) continue
    const pick = (list: string[]) => list[i % list.length]
    const url = /^url\(["']?(.*?)["']?\)$/s.exec(image)?.[1]
    const { tile, repeats: tiled } = tileOf(pick(sizes), pick(positions), pick(repeats), area, null)
    const once = intersect(tile, area)
    if (!tiled && (!once.w || !once.h)) continue
    const whole = once.w === area.w && once.h === area.h
    let content: string
    if (url) {
      // An image of unknown size fills its area once (its own size is not
      // read without loading it).
      if (pick(sizes).startsWith("auto")) note(k, "a background image of its own size, stretched to its box")
      const pixel = /pixelated|crisp-edges/.test(style.imageRendering) ? ` style="image-rendering:pixelated"` : ""
      content = `<image x="0" y="0" width="${num(tile.w)}" height="${num(tile.h)}" preserveAspectRatio="none" href="${url.replace(/"/g, "%22")}"${pixel}/>`
    } else {
      const gid = defId(k, "gradient")
      const def = gradientDef(image, tiled ? { x: 0, y: 0, w: tile.w, h: tile.h } : tile, gid, paintOf)
      if (!def) {
        note(k, "a conic gradient, drawn in its first colour")
        const first = /(rgba?\([^)]*\)|#[0-9a-f]{3,8}|oklch\([^)]*\))/i.exec(image)?.[1]
        const f = first && paintOf(first)
        if (f) out.push({ t: "rect", ...area, rx: 0, radii, fill: withAlpha(f, a) })
        continue
      }
      k.defs.set(gid, def)
      if (!tiled) {
        out.push({ t: "rect", ...once, rx: 0, radii: whole ? radii : undefined, fill: null, ref: gid })
        continue
      }
      content = `<rect width="${num(tile.w)}" height="${num(tile.h)}" fill="url(#${gid})"/>`
    }
    const id = defId(k, "pattern")
    k.defs.set(
      id,
      `<pattern id="${id}" x="${num(tile.x)}" y="${num(tile.y)}" width="${num(tile.w)}" height="${num(tile.h)}" patternUnits="userSpaceOnUse">${content}</pattern>`,
    )
    out.push({
      t: "rect",
      ...(tiled ? area : once),
      rx: 0,
      radii: tiled || whole ? radii : undefined,
      fill: null,
      ref: id,
    })
  }
  if (a < 1 && out.length) return [{ t: "g", name: "Background", opacity: a, children: out }]
  return out
}

/* ----------------------------------- box ---------------------------------- */

/** A shadow's blur, as a filter in the defs. */
function blurOf(k: Walk, blur: number): string {
  const id = `blur-${num(blur).replace(/\./g, "_")}`
  if (!k.defs.has(id))
    k.defs.set(
      id,
      `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${num(blur / 2)}"/></filter>`,
    )
  return id
}

/** The box's own paint at `b`, in paint order: outer shadows, its fill and
 * background layers (or its tone), inset rings, its border, its outline. */
function paintBox(el: Element, style: CSSStyleDeclaration, b: Box, k: Walk, out: SvgNode[], a: number) {
  const radii = radiiFor(style, b)
  const bw = SIDE_NAMES.map((s) =>
    style.getPropertyValue(`border-${s}-style`) === "none" || style.getPropertyValue(`border-${s}-style`) === "hidden"
      ? 0
      : px(style.getPropertyValue(`border-${s}-width`)),
  ) as Sides
  const shadows = shadowsOf(style.boxShadow)
  for (const s of [...shadows].reverse()) {
    if (s.inset) continue
    const p = paintOf(s.color)
    if (!p) continue
    const sp = s.spread
    const sb = { x: b.x + s.x - sp, y: b.y + s.y - sp, w: b.w + sp * 2, h: b.h + sp * 2 }
    const node: SvgNode = {
      t: "rect",
      ...sb,
      rx: 0,
      radii: radii.map(([x, y]) => [x + sp, y + sp]) as Radii,
      fill: withAlpha(p, a),
    }
    out.push(s.blur > 0 ? { t: "g", name: "Shadow", filter: blurOf(k, s.blur), children: [node] } : node)
  }
  const tone = el.classList.contains("dk-tone") || [...el.classList].some((c) => c.startsWith("dk-tone-"))
  const toned = tone ? toneNode(el, style, b, radii, k, a) : null
  if (toned) out.push(toned)
  else {
    const clips = splitTop(style.backgroundClip || "border-box")
    const clipOf = (c: string) =>
      c.includes("content")
        ? inset(inset(b, bw), SIDE_NAMES.map((s) => px(style.getPropertyValue(`padding-${s}`))) as Sides)
        : c.includes("padding")
          ? inset(b, bw)
          : b
    const area = clipOf(clips[clips.length - 1] ?? "border-box")
    const fill = paintOf(style.backgroundColor)
    if (fill && area.w > 0 && area.h > 0)
      out.push({
        t: "rect",
        ...area,
        rx: 0,
        radii: area === b ? radii : insetRadii(radii, bw),
        fill: withAlpha(fill, a),
      })
    if (!/text/.test(clips.join(" ")))
      out.push(...layers(style, area, area === b ? radii : insetRadii(radii, bw), k, a))
    const mask = style.getPropertyValue("mask-image") || style.getPropertyValue("-webkit-mask-image")
    if (!none(mask)) note(k, "a mask, drawn unmasked")
  }
  // An inset shadow of spread alone is a ring inside the border (a pressed
  // key); a blurred or offset one is left out.
  for (const s of shadows) {
    if (!s.inset) continue
    const p = paintOf(s.color)
    if (!p) continue
    if (s.blur || s.x || s.y || s.spread <= 0) {
      note(k, "a blurred or offset inset shadow, left out")
      continue
    }
    const d = bw.map((w) => w + s.spread / 2) as Sides
    out.push({
      t: "rect",
      ...inset(b, d),
      rx: 0,
      radii: insetRadii(radii, d),
      fill: null,
      stroke: { paint: withAlpha(p, a), width: s.spread },
    })
  }
  const colors = SIDE_NAMES.map((s) => paintOf(style.getPropertyValue(`border-${s}-color`)))
  if (bw.some((w, i) => w > 0 && colors[i])) {
    const same =
      bw.every((w) => w === bw[0]) && colors.every((c) => c?.hex === colors[0]?.hex && c?.alpha === colors[0]?.alpha)
    if (same && colors[0]) {
      const h = bw[0] / 2
      const d: Sides = [h, h, h, h]
      out.push({
        t: "rect",
        ...inset(b, d),
        rx: 0,
        radii: insetRadii(radii, d),
        fill: null,
        stroke: { paint: withAlpha(colors[0], a), width: bw[0] },
      })
    } else {
      const [t, r, bo, l] = bw
      const bars: Box[] = [
        { x: b.x, y: b.y, w: b.w, h: t },
        { x: b.x + b.w - r, y: b.y, w: r, h: b.h },
        { x: b.x, y: b.y + b.h - bo, w: b.w, h: bo },
        { x: b.x, y: b.y, w: l, h: b.h },
      ]
      bars.forEach((box, i) => {
        const c = colors[i]
        if (bw[i] > 0 && c) out.push({ t: "rect", ...box, rx: 0, fill: withAlpha(c, a) })
      })
      if (radii.some(([x, y]) => x > 0 && y > 0)) note(k, "a rounded border with unequal sides, drawn square")
    }
  }
  const ow = none(style.outlineStyle) ? 0 : px(style.outlineWidth)
  const oc = ow > 0 ? paintOf(style.outlineColor) : null
  if (oc) {
    const off = px(style.outlineOffset) + ow / 2
    out.push({
      t: "rect",
      x: b.x - off,
      y: b.y - off,
      w: b.w + off * 2,
      h: b.h + off * 2,
      rx: 0,
      radii: radii.map(([x, y]) => [x + off, y + off]) as Radii,
      fill: null,
      stroke: { paint: withAlpha(oc, a), width: ow },
    })
  }
}

/** An element's box as the page paints it. */
export function boxNodes(el: Element, style: CSSStyleDeclaration, k: Walk, out: SvgNode[], a: number) {
  const b = boxOf(el.getBoundingClientRect(), k)
  if (outside(b, k)) return
  paintBox(el, style, b, k, out, a)
}

/** Whether the element prints a tone: its mask is the tone, so what it
 * holds is not drawn apart from it. */
export const isTone = (el: Element) =>
  el.classList.contains("dk-tone") || [...el.classList].some((c) => c.startsWith("dk-tone-"))

/* ----------------------------- pseudo-elements ---------------------------- */

/** A `::before` or `::after` placed absolutely, drawn as its box; a masked
 * or filtered one (a rim, a glow) left out rather than painted solid, and
 * one in the flow left out. */
export function pseudoNodes(el: Element, which: "::before" | "::after", k: Walk, out: SvgNode[], a: number) {
  const ps = getComputedStyle(el, which)
  if (none(ps.content) || ps.display === "none") return
  if (ps.position !== "absolute" && ps.position !== "fixed") {
    if (ps.content !== '""' && ps.content !== "''") note(k, "an inline ::before or ::after, left out")
    return
  }
  const mask = ps.getPropertyValue("mask-image") || ps.getPropertyValue("-webkit-mask-image")
  if (!none(mask) || !none(ps.filter)) {
    note(k, "a masked or filtered ::before or ::after, left out")
    return
  }
  const w = px(ps.width)
  const h = px(ps.height)
  if (!w || !h) return
  const host = boxOf(el.getBoundingClientRect(), k)
  const cs = getComputedStyle(el)
  const pad = inset(host, SIDE_NAMES.map((s) => px(cs.getPropertyValue(`border-${s}-width`))) as Sides)
  const left = Number.parseFloat(ps.left)
  const top = Number.parseFloat(ps.top)
  const right = Number.parseFloat(ps.right)
  const bottom = Number.parseFloat(ps.bottom)
  const x = Number.isNaN(left) ? (Number.isNaN(right) ? pad.x : pad.x + pad.w - right - w) : pad.x + left
  const y = Number.isNaN(top) ? (Number.isNaN(bottom) ? pad.y : pad.y + pad.h - bottom - h) : pad.y + top
  const opacity = Number.parseFloat(ps.opacity || "1")
  if (!(opacity > 0)) return
  const nodes: SvgNode[] = []
  paintBox(el, ps, { x, y, w, h }, k, nodes, a * opacity)
  if (nodes.length) out.push({ t: "g", name: which === "::before" ? "Before" : "After", children: nodes })
}

/* --------------------------------- clipping -------------------------------- */

/** The clip a box sets on what it draws: a basic-shape `clip-path` over
 * its border box, else its padding box (with its corners) where it clips
 * overflow; the clip's id in the defs, or none. */
export function clipOf(el: Element, style: CSSStyleDeclaration, k: Walk): string | undefined {
  const cp = style.clipPath
  const clips = [style.overflow, style.overflowX, style.overflowY].some((v) =>
    /\b(hidden|clip|auto|scroll)\b/.test(v ?? ""),
  )
  if (none(cp) && !clips) return undefined
  const b = boxOf(el.getBoundingClientRect(), k)
  let shape: string | null = null
  if (!none(cp)) {
    shape = clipShape(cp, b)
    if (!shape) note(k, "a clip-path that is not a basic shape, left unclipped")
  }
  if (!shape && clips) {
    const bw = SIDE_NAMES.map((s) => px(style.getPropertyValue(`border-${s}-width`))) as Sides
    shape = `<path d="${roundedPath(inset(b, bw), insetRadii(radiiFor(style, b), bw))}"/>`
  }
  if (!shape) return undefined
  const id = defId(k, "clip")
  k.defs.set(id, `<clipPath id="${id}">${shape}</clipPath>`)
  return id
}

/* ------------------------------ native controls ---------------------------- */

const NATIVE = new Set(["checkbox", "radio", "range"])

/** Whether the browser draws this control itself (no boxes to read). */
export const isNative = (el: Element, style: CSSStyleDeclaration): el is HTMLInputElement =>
  el instanceof HTMLInputElement && NATIVE.has(el.type) && style.appearance !== "none"

/** A control the browser draws, as plain shapes in its accent: a box or a
 * ring, filled and marked when checked; a slider's track, its filled part
 * and its thumb at its value. */
export function nativeNodes(el: HTMLInputElement, style: CSSStyleDeclaration, k: Walk, out: SvgNode[], a: number) {
  const b = boxOf(el.getBoundingClientRect(), k)
  if (outside(b, k)) return
  note(k, "a control the browser draws, drawn as plain shapes")
  const accent: Paint = paintOf(style.accentColor) ?? paintOf(style.color) ?? { hex: "#1a73e8", alpha: 1 }
  const edge: Paint = { hex: "#767676", alpha: 1 }
  const ground: Paint = { hex: "#ffffff", alpha: 1 }
  const nodes: SvgNode[] = []
  if (el.type === "range") {
    const min = Number(el.min || 0)
    const max = Number(el.max || 100)
    const at = max > min ? (Number(el.value) - min) / (max - min) : 0
    const th = Math.min(4, b.h)
    const ty = b.y + (b.h - th) / 2
    const r = th / 2
    nodes.push({ t: "rect", x: b.x, y: ty, w: b.w, h: th, rx: r, fill: withAlpha({ hex: "#efefef", alpha: 1 }, a) })
    nodes.push({ t: "rect", x: b.x, y: ty, w: b.w * at, h: th, rx: r, fill: withAlpha(accent, a) })
    const d = Math.min(b.h, 16)
    nodes.push({
      t: "rect",
      x: b.x + (b.w - d) * at,
      y: b.y + (b.h - d) / 2,
      w: d,
      h: d,
      rx: d / 2,
      fill: withAlpha(accent, a),
    })
  } else {
    const s = Math.min(b.w, b.h)
    const box = { x: b.x + (b.w - s) / 2, y: b.y + (b.h - s) / 2, w: s, h: s }
    const rx = el.type === "radio" ? s / 2 : Math.min(2, s / 4)
    if (el.checked) {
      nodes.push({ t: "rect", ...box, rx, fill: withAlpha(accent, a) })
      if (el.type === "radio") {
        const dot = s / 2.5
        nodes.push({
          t: "rect",
          x: box.x + (s - dot) / 2,
          y: box.y + (s - dot) / 2,
          w: dot,
          h: dot,
          rx: dot / 2,
          fill: withAlpha(ground, a),
        })
      } else
        nodes.push({
          t: "shape",
          markup: `<path d="M${num(box.x + s * 0.22)} ${num(box.y + s * 0.52)}l${num(s * 0.2)} ${num(s * 0.2)}l${num(s * 0.38)} ${num(-s * 0.42)}" stroke="${ground.hex}" stroke-width="${num(Math.max(1, s / 7))}" fill="none"/>`,
        })
    } else
      nodes.push({
        t: "rect",
        x: box.x + 0.5,
        y: box.y + 0.5,
        w: s - 1,
        h: s - 1,
        rx,
        fill: withAlpha(ground, a),
        stroke: { paint: withAlpha(edge, a), width: 1 },
      })
  }
  out.push({ t: "g", name: el.getAttribute("aria-label") || el.type, children: nodes })
}
