// SVG as a model (`../models.ts`): each filled shape of the drawing, its
// curves flattened and its holes cut, is triangulated once and extruded into
// a solid slab, so a vector mark, icon or lockup turns, lights and prints
// through the same raster as any mesh (the GPU engine takes it when it is
// big). Stroke-only shapes become lines on the front face. Later shapes
// stand a step in front of earlier ones, as they paint in the drawing.
// Its own SMIL animation (`svg-motion.ts`) plays on the kit clock.
// Bounded like every parser: curves are cut by size, and a drawing stops
// taking points past MAX_POINTS.

import { addMesh, emptyWorld, finishWorld, type World } from "../world-scene"
import type { Rgb } from "../palette"
import { hexToRgb } from "../palette"
import { MAX_NODES } from "./shared"
import { parseXml, type XmlEl } from "./x3d"
import { animatedNode } from "./svg-motion"
import {
  apply,
  dist,
  flattenPath,
  IDENTITY,
  mul,
  nums,
  parseTransform,
  type Affine,
  type Pt,
  type Ring,
} from "./svg-path"

export { flattenPath, parseTransform } from "./svg-path"

/** The most outline points one drawing is read into. */
export const MAX_POINTS = 200_000

const NAMED: Record<string, Rgb> = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  red: [255, 0, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  yellow: [255, 255, 0],
  orange: [255, 165, 0],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
}

/** A paint: a colour, "none", or null where the value names nothing the
 * reader knows (a gradient, `currentColor`): those print in the grey. */
export function parsePaint(s: string | undefined): Rgb | "none" | null {
  const v = s?.trim().toLowerCase()
  if (!v) return null
  if (v === "none" || v === "transparent") return "none"
  if (v.startsWith("#")) return hexToRgb(v)
  const rgb = v.match(/^rgba?\(([^)]*)\)/)
  if (rgb) {
    const [r, g, b] = rgb[1].split(/[\s,/]+/).map((c) => (c.endsWith("%") ? parseFloat(c) * 2.55 : parseFloat(c)))
    return [r || 0, g || 0, b || 0]
  }
  return NAMED[v] ?? null
}

/** An element's outline as path data: the basic shapes written as paths. */
function pathOf(el: XmlEl): string | null {
  const a = el.attrs
  const n = (k: string) => parseFloat(a[k] ?? "0") || 0
  switch (el.name) {
    case "path":
      return a.d ?? null
    case "rect": {
      const [x, y, w, h] = [n("x"), n("y"), n("width"), n("height")]
      if (w <= 0 || h <= 0) return null
      let rx = Math.min(w / 2, a.rx !== undefined ? n("rx") : n("ry"))
      let ry = Math.min(h / 2, a.ry !== undefined ? n("ry") : n("rx"))
      if (rx <= 0 || ry <= 0) rx = ry = 0
      if (!rx) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`
      return (
        `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}` +
        `A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}` +
        `V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`
      )
    }
    case "circle":
    case "ellipse": {
      const rx = el.name === "circle" ? n("r") : n("rx")
      const ry = el.name === "circle" ? n("r") : n("ry")
      const [cx, cy] = [n("cx"), n("cy")]
      if (rx <= 0 || ry <= 0) return null
      return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`
    }
    case "polygon":
    case "polyline": {
      const v = nums(a.points ?? "")
      if (v.length < 4) return null
      let d = `M${v[0]} ${v[1]}`
      for (let k = 2; k + 1 < v.length; k += 2) d += `L${v[k]} ${v[k + 1]}`
      return el.name === "polygon" ? `${d}Z` : d
    }
    case "line":
      return `M${n("x1")} ${n("y1")}L${n("x2")} ${n("y2")}`
    default:
      return null
  }
}

// ---- triangulation ------------------------------------------------------------------

const area = (r: Ring) => {
  let s = 0
  for (let k = 0, j = r.length - 1; k < r.length; j = k++) s += (r[j][0] - r[k][0]) * (r[j][1] + r[k][1])
  return s / 2
}
const cross = (a: Pt, b: Pt, c: Pt) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

function inside(r: Ring, [x, y]: Pt): boolean {
  let hit = false
  for (let k = 0, j = r.length - 1; k < r.length; j = k++) {
    const [xi, yi] = r[k]
    const [xj, yj] = r[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

/** Rings into shapes: an outer ring and the holes cut in it, by how deep
 * each ring nests (even depth fills, odd cuts: the even-odd rule, which a
 * nonzero drawing's reversed holes also follow). Outer rings come out
 * counter-clockwise, holes clockwise. */
export function nest(rings: Ring[]): { outer: Ring; holes: Ring[] }[] {
  const depth = rings.map((r, k) => rings.filter((o, j) => j !== k && inside(o, r[0])).length)
  const shapes: { outer: Ring; holes: Ring[] }[] = []
  const owner = new Map<number, number>()
  rings.forEach((r, k) => {
    if (depth[k] % 2) return
    owner.set(k, shapes.length)
    shapes.push({ outer: area(r) < 0 ? r.slice().reverse() : r, holes: [] })
  })
  rings.forEach((r, k) => {
    if (!(depth[k] % 2)) return
    // the hole's parent: the ring one level up that holds it
    const parent = rings.findIndex((o, j) => depth[j] === depth[k] - 1 && inside(o, r[0]))
    const shape = owner.get(parent)
    if (shape !== undefined) shapes[shape].holes.push(area(r) > 0 ? r.slice().reverse() : r)
  })
  return shapes
}

/** One counter-clockwise polygon with clockwise holes, as triangles over the
 * returned points (each hole bridged into the outline from its rightmost
 * point, then ear clipping). */
export function triangulate(outer: Ring, holes: Ring[] = []): { points: Pt[]; triangles: number[] } {
  // the points in the order given (the outline, then each hole), so a
  // caller can tell which ring a point is on
  const points: Pt[] = [...outer]
  let loop = outer.map((_, k) => k)
  const bridged = holes
    .map((h) => {
      const base = points.length
      points.push(...h)
      let right = 0
      for (let k = 1; k < h.length; k++) if (h[k][0] > h[right][0]) right = k
      return { h, base, right }
    })
    .filter(({ h }) => h.length > 2)
    .sort((a, b) => b.h[b.right][0] - a.h[a.right][0])
  for (const { h, base, right } of bridged) {
    const m = h[right]
    // the loop's vertex the hole's rightmost point sees: the nearest one
    // right of it, not across any edge of the loop
    let best = -1
    let bestD = Infinity
    for (let k = 0; k < loop.length; k++) {
      const p = points[loop[k]]
      if (p[0] < m[0]) continue
      const d = dist(p, m)
      if (d >= bestD) continue
      let blocked = false
      for (let j = 0; j < loop.length && !blocked; j++) {
        const a = loop[j]
        const b = loop[(j + 1) % loop.length]
        if (a === loop[k] || b === loop[k]) continue
        const [pa, pb] = [points[a], points[b]]
        blocked = cross(m, p, pa) * cross(m, p, pb) < 0 && cross(pa, pb, m) * cross(pa, pb, p) < 0
      }
      if (!blocked) {
        best = k
        bestD = d
      }
    }
    if (best < 0) continue
    const ring = h.map((_, j) => base + ((right + j) % h.length))
    loop = [...loop.slice(0, best + 1), ...ring, base + right, ...loop.slice(best)]
  }
  // ear clipping, walking on from the last ear (no restart), so a ring of
  // n points costs n squared at most
  const triangles: number[] = []
  const v = loop
  let k = 0
  let misses = 0
  while (v.length > 3) {
    k %= v.length
    const ia = v[(k + v.length - 1) % v.length]
    const ib = v[k]
    const ic = v[(k + 1) % v.length]
    const [a, b, c] = [points[ia], points[ib], points[ic]]
    let ear = misses >= v.length || cross(a, b, c) > 0
    if (ear && misses < v.length)
      for (let j = 0; j < v.length && ear; j++) {
        const p = points[v[j]]
        // a bridge repeats its two points: the same point is never inside
        if (p === a || p === b || p === c) continue
        if (cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0) ear = false
      }
    if (!ear) {
      k++
      misses++
      continue
    }
    // a full lap with no ear (a self-touching outline): the corner is cut
    // all the same, kept only where it turns the right way
    if (cross(a, b, c) > 0) triangles.push(ia, ib, ic)
    v.splice(k, 1)
    misses = 0
  }
  if (cross(points[v[0]], points[v[1]], points[v[2]]) > 0) triangles.push(v[0], v[1], v[2])
  return { points, triangles }
}

// ---- the drawing --------------------------------------------------------------------

export type SvgOptions = {
  /** Slab depth as a share of the drawing's larger side. */
  depth?: number
}

type Paint = { fill: Rgb | "none" | null; stroke: Rgb | "none" | null }

const styleOf = (el: XmlEl, key: string) =>
  el.attrs.style?.match(new RegExp(`(?:^|;)\\s*${key}\\s*:\\s*([^;]+)`))?.[1] ?? el.attrs[key]

/** An SVG drawing as a world of slabs. */
export function parseSvg(text: string, opts: SvgOptions = {}): World {
  const world = emptyWorld()
  const items: { rings: { ring: Ring; closed: boolean }[]; node: number; paint: Paint }[] = []
  let points = 0
  let visited = 0
  const root = parseXml(text).children.find((c) => c.name === "svg" || c.name.endsWith(":svg"))
  if (!root) return finishWorld(world)
  const box = nums(root.attrs.viewBox ?? "")
  const size = box.length === 4 ? Math.max(box[2], box[3]) : parseFloat(root.attrs.width ?? "") || 100
  const tol = Math.max(size, 1) / 1000
  // `m` runs from the frame of `node` (the nearest animated element, -1 for
  // the page) to the element's parent
  const walk = (el: XmlEl, m: Affine, node: number, inherited: Paint) => {
    if (++visited > MAX_NODES || points > MAX_POINTS) return
    if (
      ["defs", "clipPath", "mask", "symbol", "pattern", "linearGradient", "radialGradient", "style"].includes(el.name)
    )
      return
    const fill = styleOf(el, "fill")
    const stroke = styleOf(el, "stroke")
    const paint: Paint = {
      fill: fill === undefined ? inherited.fill : parsePaint(fill),
      stroke: stroke === undefined ? inherited.stroke : parsePaint(stroke),
    }
    if (styleOf(el, "display") === "none" || styleOf(el, "visibility") === "hidden") return
    const own = parseTransform(el.attrs.transform)
    const moving = animatedNode(world, el, m, own, node, tol)
    const here = moving ? moving.local : mul(m, own)
    const at = moving ? moving.node : node
    const d = pathOf(el)
    if (d) {
      const rings = flattenPath(d, tol).map((r) => ({ ring: r.ring.map((p) => apply(here, p)), closed: r.closed }))
      points += rings.reduce((s, r) => s + r.ring.length, 0)
      if (rings.length) items.push({ rings, node: at, paint: el.name === "line" ? { ...paint, fill: "none" } : paint })
    }
    for (const c of el.children) walk(c, here, at, paint)
  }
  // SVG's default paint: filled black, no stroke
  walk(root, IDENTITY, -1, { fill: [0, 0, 0], stroke: "none" })
  const depth = size * (opts.depth ?? 0.03)
  const step = depth * 0.04
  // y runs down the page and up the world
  const flip = ([x, y]: Pt): Pt => [x, -y]
  items.forEach(({ rings, node, paint }, order) => {
    const front = order * step
    if (paint.fill !== "none") {
      const geo = slab(
        nest(rings.map((r) => r.ring.map(flip)).filter((r) => r.length > 2 && Math.abs(area(r)) > 1e-12)),
        front,
        front - depth,
      )
      if (geo) addMesh(world, geo, null, paint.fill ?? [204, 204, 204], true, { node })
    } else if (paint.stroke && paint.stroke !== "none") {
      const pts: number[] = []
      const lines: number[][] = []
      for (const { ring, closed } of rings) {
        const base = pts.length / 3
        for (const p of ring.map(flip)) pts.push(p[0], p[1], front)
        lines.push([...ring.map((_, k) => base + k), ...(closed ? [base] : [])])
      }
      addMesh(world, { points: pts, faces: lines }, null, paint.stroke, false, { kind: "lines", node })
    }
  })
  finishWorld(world)
  // a drawing that moves is framed by its page, which its motion keeps to
  if (world.nodes.length && box.length === 4) {
    world.center = [box[0] + box[2] / 2, -(box[1] + box[3] / 2), -depth / 2]
    world.radius = Math.hypot(box[2], box[3]) / 2
  }
  return world
}

/** Shapes extruded between two depths: both caps (their triangulation's
 * diagonals hidden from the wire) and the walls, whose seams show only at
 * a corner. */
function slab(shapes: { outer: Ring; holes: Ring[] }[], zf: number, zb: number) {
  const pts: number[] = []
  const faces: number[][] = []
  const drawn: boolean[][] = []
  const CORNER = Math.cos((30 * Math.PI) / 180)
  for (const { outer, holes } of shapes) {
    const { points, triangles } = triangulate(outer, holes)
    const f0 = pts.length / 3
    for (const [x, y] of points) pts.push(x, y, zf)
    const b0 = pts.length / 3
    for (const [x, y] of points) pts.push(x, y, zb)
    // an edge of the outline joins neighbours of one ring
    const rings = [outer, ...holes]
    const ringOf: [number, number][] = []
    rings.forEach((r, ri) => r.forEach((_, k) => ringOf.push([ri, k])))
    const rim = (a: number, b: number) => {
      const [ra, ka] = ringOf[a]
      const [rb, kb] = ringOf[b]
      const n = rings[ra].length
      return ra === rb && ((ka + 1) % n === kb || (kb + 1) % n === ka)
    }
    for (let t = 0; t < triangles.length; t += 3) {
      const [a, b, c] = [triangles[t], triangles[t + 1], triangles[t + 2]]
      const edges = [rim(a, b), rim(b, c), rim(c, a)]
      faces.push([f0 + a, f0 + b, f0 + c])
      drawn.push(edges)
      faces.push([b0 + c, b0 + b, b0 + a])
      drawn.push([edges[1], edges[0], edges[2]])
    }
    let at = 0
    for (const r of rings) {
      const n = r.length
      const turn = (k: number) => {
        const p = r[(k + n - 1) % n]
        const q = r[k]
        const s = r[(k + 1) % n]
        const u = [q[0] - p[0], q[1] - p[1]]
        const w = [s[0] - q[0], s[1] - q[1]]
        return (u[0] * w[0] + u[1] * w[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(w[0], w[1]) || 1) < CORNER
      }
      for (let k = 0; k < n; k++) {
        const a = at + k
        const b = at + ((k + 1) % n)
        faces.push([f0 + b, f0 + a, b0 + a, b0 + b])
        // each wall its leading seam, so a corner is drawn once
        drawn.push([false, turn(k), false, false])
      }
      at += n
    }
  }
  return faces.length ? { points: pts, faces, drawn } : null
}
