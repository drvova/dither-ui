// Computed CSS read as SVG, for the frame reader (`vector.ts`): corner
// radii (each corner its own) as a rect or arcs, background layers
// (linear and radial gradients as SVG gradients, a tile as a pattern),
// basic-shape `clip-path`s and shadows. Framework-free: each function takes
// the computed strings and a box, and writes defs and path data; the walk
// hands them over, so the rules are tested without a browser.
type Box = { x: number; y: number; w: number; h: number }
/** A CSS colour as a paint (the reader's, which also reads `oklch()`). */
type Resolve = (css: string) => { hex: string; alpha: number } | null

/** A number as the file writes it: two decimals at most. */
export const num = (v: number): string => String(Math.round(v * 100) / 100)
/** Corner radii, clockwise from the top left, each [horizontal, vertical]. */
export type Radii = [[number, number], [number, number], [number, number], [number, number]]

/** Attributes from a record: numbers through `num`, empty values left out;
 * values are computed CSS, never page text. */
function attrs(a: Record<string, string | number | undefined>): string {
  let out = ""
  for (const [k, v] of Object.entries(a))
    if (v !== undefined && v !== "") out += ` ${k}="${typeof v === "number" ? num(v) : v.replace(/"/g, "&quot;")}"`
  return out
}

/** Radii scaled down together until adjacent ones fit their side (CSS
 * Backgrounds 3, "overlapping curves"). */
function fitRadii(r: Radii, w: number, h: number): Radii {
  const [tl, tr, br, bl] = r
  const f = Math.min(
    1,
    w / (tl[0] + tr[0] || Infinity),
    w / (bl[0] + br[0] || Infinity),
    h / (tl[1] + bl[1] || Infinity),
    h / (tr[1] + br[1] || Infinity),
  )
  return f < 1 ? (r.map(([x, y]) => [x * f, y * f]) as Radii) : r
}

/** Each radius less `d` (an inner edge: the padding box inside a border). */
export const insetRadii = (r: Radii, d: [number, number, number, number]): Radii => {
  const [t, ri, b, l] = d
  return [
    [Math.max(0, r[0][0] - l), Math.max(0, r[0][1] - t)],
    [Math.max(0, r[1][0] - ri), Math.max(0, r[1][1] - t)],
    [Math.max(0, r[2][0] - ri), Math.max(0, r[2][1] - b)],
    [Math.max(0, r[3][0] - l), Math.max(0, r[3][1] - b)],
  ]
}

/** Whether every corner is the same (a plain `rx`/`ry` says it). */
export const uniformRadii = (r: Radii) => r.every(([x, y]) => x === r[0][0] && y === r[0][1])

/** A rounded box as path data, clockwise from the top left. */
export function roundedPath(b: Box, radii: Radii): string {
  const [[ax, ay], [bx, by], [cx, cy], [dx, dy]] = fitRadii(radii, b.w, b.h)
  const { x, y, w, h } = b
  const arc = (rx: number, ry: number, ex: number, ey: number) =>
    rx > 0 && ry > 0 ? `A${num(rx)} ${num(ry)} 0 0 1 ${num(ex)} ${num(ey)}` : `L${num(ex)} ${num(ey)}`
  return (
    `M${num(x + ax)} ${num(y)}H${num(x + w - bx)}${arc(bx, by, x + w, y + by)}` +
    `V${num(y + h - cy)}${arc(cx, cy, x + w - cx, y + h)}` +
    `H${num(x + dx)}${arc(dx, dy, x, y + h - dy)}` +
    `V${num(y + ay)}${arc(ax, ay, x + ax, y)}Z`
  )
}

/** Split at the commas (or the spaces) not inside parentheses. */
export function splitTop(s: string, sep: "," | " " = ","): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ""
  for (const ch of s) {
    if (ch === "(") depth++
    else if (ch === ")") depth--
    if (depth === 0 && (sep === "," ? ch === "," : /\s/.test(ch))) {
      if (cur.trim()) out.push(cur.trim())
      cur = ""
    } else cur += ch
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

/** A CSS length against a reference (percentages); null for what is not
 * one (`auto`, a keyword). */
function cssLength(v: string, ref: number): number | null {
  const m = v.trim().match(/^(-?[\d.]+)(px|%)?$/)
  if (!m) return null
  return m[2] === "%" ? (parseFloat(m[1]) / 100) * ref : parseFloat(m[1])
}

/** The four computed corner radii (`8px`, `50%`, `8px 4px`) of a box. */
export function radiiOf(corners: [string, string, string, string], w: number, h: number): Radii {
  return corners.map((c) => {
    const [a, b = a] = c.trim().split(/\s+/)
    return [cssLength(a, w) ?? 0, cssLength(b, h) ?? 0]
  }) as Radii
}

type Stop = { color: string; at: number | null }

/** A gradient's colour stops, each at a fraction of `extent` px (a `%`
 * or a length), the missing positions spread evenly as CSS does. */
function stopsOf(parts: string[], extent: number): Stop[] {
  const stops: Stop[] = []
  for (const p of parts) {
    // A stop is a colour and up to two positions; a bare position is a hint.
    const tokens = splitTop(p, " ")
    const positions = tokens.filter((t) => cssLength(t, extent) !== null)
    const color = tokens.filter((t) => cssLength(t, extent) === null).join(" ")
    if (!color) continue
    const at = positions.map((t) => (cssLength(t, extent) as number) / (extent || 1))
    if (!at.length) stops.push({ color, at: null })
    for (const a of at) stops.push({ color, at: a })
  }
  if (!stops.length) return stops
  if (stops[0].at === null) stops[0].at = 0
  if (stops[stops.length - 1].at === null) stops[stops.length - 1].at = 1
  for (let i = 1; i < stops.length; i++) {
    if (stops[i].at !== null) {
      stops[i].at = Math.max(stops[i].at!, stops[i - 1].at!)
      continue
    }
    let j = i
    while (stops[j].at === null) j++
    const from = stops[i - 1].at!
    const step = (stops[j].at! - from) / (j - i + 1)
    for (let k = i; k < j; k++) stops[k].at = from + step * (k - i + 1)
  }
  return stops
}

const stopTags = (stops: Stop[], resolve: Resolve) =>
  stops
    .map((s) => {
      const p = resolve(s.color)
      // Offsets to four places: a dot screen's hard stop sits near 0.
      return `<stop${attrs({ offset: String(Math.round(Math.min(1, Math.max(0, s.at!)) * 1e4) / 1e4), "stop-color": p?.hex ?? "#000000", "stop-opacity": p ? (p.alpha < 1 ? p.alpha : undefined) : 0 })}/>`
    })
    .join("")

const SIDES: Record<string, number> = {
  top: 0,
  "top right": 45,
  right: 90,
  "bottom right": 135,
  bottom: 180,
  "bottom left": 225,
  left: 270,
  "top left": 315,
}

/** The angle of a `linear-gradient` in degrees, and the stop list after it. */
function linearAngle(parts: string[], w: number, h: number): [number, string[]] {
  const first = parts[0]
  const deg = first.match(/^(-?[\d.]+)(deg|turn|rad|grad)$/)
  if (deg) {
    const v = parseFloat(deg[1])
    const unit = { deg: 1, turn: 360, rad: 180 / Math.PI, grad: 0.9 }[deg[2] as "deg"]
    return [v * unit, parts.slice(1)]
  }
  const to = first.match(/^to\s+(.+)$/)
  if (to) {
    const side = to[1]
      .split(/\s+/)
      .sort((a, b) => (a === "top" || a === "bottom" ? -1 : b === "top" || b === "bottom" ? 1 : 0))
      .join(" ")
    // A corner points at the corner of THIS box, not 45° (CSS Images 3).
    if (side.includes(" ")) {
      const a = (Math.atan2(w, h) * 180) / Math.PI
      const corner = { "top right": 90 - a, "bottom right": 90 + a, "bottom left": 270 - a, "top left": 270 + a }
      return [corner[side as keyof typeof corner] ?? SIDES[side] ?? 180, parts.slice(1)]
    }
    return [SIDES[side] ?? 180, parts.slice(1)]
  }
  return [180, parts]
}

/** A gradient image as an SVG gradient over `box` (user space): its def,
 * or null for one SVG cannot draw (a conic gradient). */
export function gradientDef(image: string, box: Box, id: string, resolve: Resolve): string | null {
  const m = image.match(/^(repeating-)?(linear|radial)-gradient\((.*)\)$/s)
  if (!m) return null
  const parts = splitTop(m[3])
  const spread = m[1] ? "repeat" : undefined
  if (m[2] === "linear") {
    const [angle, rest] = linearAngle(parts, box.w, box.h)
    const a = (angle * Math.PI) / 180
    const len = Math.abs(box.w * Math.sin(a)) + Math.abs(box.h * Math.cos(a))
    const cx = box.x + box.w / 2
    const cy = box.y + box.h / 2
    const dx = (Math.sin(a) * len) / 2
    const dy = (-Math.cos(a) * len) / 2
    return (
      `<linearGradient${attrs({ id, gradientUnits: "userSpaceOnUse", x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy, spreadMethod: spread })}>` +
      `${stopTags(stopsOf(rest, len), resolve)}</linearGradient>`
    )
  }
  // radial: [shape] [size] [at position], then stops.
  const head =
    /^(circle|ellipse|closest|farthest|at\s|[\d.]+px)/.test(parts[0]) && !resolve(splitTop(parts[0], " ")[0])
      ? parts[0]
      : ""
  const rest = head ? parts.slice(1) : parts
  const at = head.match(/at\s+(\S+)(?:\s+(\S+))?/)
  const cx = box.x + (at ? (cssLength(at[1], box.w) ?? keyword(at[1], box.w)) : box.w / 2)
  const cy = box.y + (at ? (cssLength(at[2] ?? "center", box.h) ?? keyword(at[2] ?? "center", box.h)) : box.h / 2)
  const sizing = head.split(/\bat\s/)[0]
  const circle = /circle/.test(sizing) || /^[\d.]+px$/.test(sizing.trim())
  const dxs = [cx - box.x, box.x + box.w - cx]
  const dys = [cy - box.y, box.y + box.h - cy]
  const closest = /closest/.test(sizing)
  const pick = (v: number[]) => (closest ? Math.min(...v) : Math.max(...v))
  const explicit = sizing.match(/(?:^|\s)([\d.]+)px(?:\s+([\d.]+)px)?/)
  let rx: number
  let ry: number
  if (explicit) {
    rx = parseFloat(explicit[1])
    ry = explicit[2] ? parseFloat(explicit[2]) : rx
  } else if (/side/.test(sizing)) {
    rx = pick(dxs)
    ry = circle ? rx : pick(dys)
    if (circle) rx = ry = Math.min(pick(dxs), pick(dys))
  } else {
    // corner (the default, farthest-corner): an ellipse keeps the side ratio.
    const corner = Math.hypot(pick(dxs), pick(dys))
    if (circle) rx = ry = corner
    else {
      rx = pick(dxs) * Math.SQRT2
      ry = pick(dys) * Math.SQRT2
    }
  }
  rx = Math.max(rx, 0.01)
  ry = Math.max(ry, 0.01)
  const transform =
    ry !== rx
      ? `translate(${num(cx)} ${num(cy)}) scale(1 ${num(ry / rx)}) translate(${num(-cx)} ${num(-cy)})`
      : undefined
  return (
    `<radialGradient${attrs({ id, gradientUnits: "userSpaceOnUse", cx, cy, r: rx, gradientTransform: transform, spreadMethod: spread })}>` +
    `${stopTags(stopsOf(rest, rx), resolve)}</radialGradient>`
  )
}

const keyword = (k: string, ref: number) =>
  ({ left: 0, top: 0, center: ref / 2, right: ref, bottom: ref })[k] ?? ref / 2

/** A background layer's tile: its box over the area (`background-size`,
 * `background-position`) and whether it repeats; `natural` is an image's
 * own size (a gradient has none, so it fills the area). */
export function tileOf(
  size: string,
  position: string,
  repeat: string,
  box: Box,
  natural: [number, number] | null,
): { tile: Box; repeats: boolean } {
  const [sw = "auto", sh = "auto"] = splitTop(size, " ")
  let w: number
  let h: number
  if (sw === "cover" || sw === "contain") {
    const [nw, nh] = natural ?? [box.w, box.h]
    const k = sw === "cover" ? Math.max(box.w / nw, box.h / nh) : Math.min(box.w / nw, box.h / nh)
    w = nw * k
    h = nh * k
  } else {
    const lw = cssLength(sw, box.w)
    const lh = cssLength(sh, box.h)
    const [nw, nh] = natural ?? [box.w, box.h]
    w = lw ?? (lh !== null && natural ? (lh * nw) / nh : nw)
    h = lh ?? (lw !== null && natural ? (lw * nh) / nw : nh)
  }
  const [px = "0%", py = "0%"] = splitTop(position, " ")
  const off = (v: string, free: number) => cssLength(v, free) ?? keyword(v, free)
  const x = off(px, box.w - w)
  const y = off(py, box.h - h)
  const tile = { x: box.x + x, y: box.y + y, w, h }
  const covers = Math.abs(w - box.w) < 0.5 && Math.abs(h - box.h) < 0.5 && Math.abs(x) < 0.5 && Math.abs(y) < 0.5
  return { tile, repeats: !covers && repeat.trim() !== "no-repeat" && repeat.trim() !== "no-repeat no-repeat" }
}

/** A CSS `clip-path` basic shape over a border box as an SVG `<path>`, or
 * null for one this cannot read (a `url()`, a geometry box keyword). */
export function clipShape(clip: string, box: Box): string | null {
  const m = clip.match(/^path\((.*)\)/s)
  if (m) {
    const d = m[1].match(/["'](.*)["']/s)?.[1]
    return d ? `<path${attrs({ transform: `translate(${num(box.x)} ${num(box.y)})`, d })}/>` : null
  }
  const d = clipData(clip, box)
  return d ? `<path${attrs({ d })}/>` : null
}

function clipData(clip: string, box: Box): string | null {
  const m = clip.match(/^(inset|polygon|circle|ellipse)\((.*)\)/s)
  if (!m) return null
  const body = m[2].trim()
  const X = (v: string) => box.x + (cssLength(v, box.w) ?? keyword(v, box.w))
  const Y = (v: string) => box.y + (cssLength(v, box.h) ?? keyword(v, box.h))
  switch (m[1]) {
    case "polygon": {
      const pts = splitTop(body.replace(/^(nonzero|evenodd)\s*,/, ""))
        .map((p) => splitTop(p, " "))
        .filter((p) => p.length === 2)
      if (pts.length < 3) return null
      return pts.map(([x, y], i) => `${i ? "L" : "M"}${num(X(x))} ${num(Y(y))}`).join("") + "Z"
    }
    case "inset": {
      const [shape, round] = body.split(/\s+round\s+/)
      const v = splitTop(shape, " ")
      const [t, r = t, b = t, l = r] = v
      const top = cssLength(t, box.h) ?? 0
      const right = cssLength(r, box.w) ?? 0
      const bottom = cssLength(b, box.h) ?? 0
      const left = cssLength(l, box.w) ?? 0
      const inner = { x: box.x + left, y: box.y + top, w: box.w - left - right, h: box.h - top - bottom }
      const rv = round ? splitTop(round, " ").map((x) => cssLength(x, inner.w) ?? 0) : [0]
      const [a, bb = a, c = a, d = bb] = rv
      return roundedPath(inner, [
        [a, a],
        [bb, bb],
        [c, c],
        [d, d],
      ])
    }
    case "circle":
    case "ellipse": {
      const [size, at] = body.split(/\s*at\s+/)
      const [px = "center", py = "center"] = at ? splitTop(at, " ") : []
      const cx = X(px)
      const cy = Y(py)
      const radii = splitTop(size ?? "", " ")
      const side = (v: string | undefined, ref: number, near: number[]) =>
        v === undefined || v === "closest-side"
          ? Math.min(...near)
          : v === "farthest-side"
            ? Math.max(...near)
            : (cssLength(v, ref) ?? Math.min(...near))
      const nx = [cx - box.x, box.x + box.w - cx]
      const ny = [cy - box.y, box.y + box.h - cy]
      const rx =
        m[1] === "circle"
          ? side(radii[0], Math.hypot(box.w, box.h) / Math.SQRT2, [...nx, ...ny])
          : side(radii[0], box.w, nx)
      const ry = m[1] === "circle" ? rx : side(radii[1], box.h, ny)
      return `M${num(cx - rx)} ${num(cy)}a${num(rx)} ${num(ry)} 0 1 0 ${num(rx * 2)} 0a${num(rx)} ${num(ry)} 0 1 0 ${num(-rx * 2)} 0Z`
    }
  }
  return null
}

type Shadow = { x: number; y: number; blur: number; spread: number; color: string; inset: boolean }

/** A computed `box-shadow` list (`rgb(0 0 0 / .2) 0px 4px 12px 0px`, with
 * `inset` where it is one). */
export function shadowsOf(v: string): Shadow[] {
  if (!v || v === "none") return []
  return splitTop(v).map((s) => {
    const t = splitTop(s, " ")
    const inset = t.includes("inset")
    const lens = t.filter((x) => /^-?[\d.]+(px)?$/.test(x)).map(parseFloat)
    const color = t.filter((x) => x !== "inset" && !/^-?[\d.]+(px)?$/.test(x)).join(" ") || "rgb(0, 0, 0)"
    const [x = 0, y = 0, blur = 0, spread = 0] = lens
    return { x, y, blur, spread, color, inset }
  })
}
