// The annotation pen: points in, SVG paths out. Ink is a filled outline
// whose width follows pen pressure, or the stroke's speed for a mouse
// (fast thins, slow swells), with tapered ends; the marker is a flat,
// translucent centre line. The eraser cuts strokes only where it passes.
import type { Box, Point } from "./geometry"

/** x, y, time in ms, pressure 0–1 (or -1 when the device reports none). */
export type InkPoint = [number, number, number, number]

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const r1 = (v: number) => Math.round(v * 10) / 10

/** Damp the hand's jitter: each point eases toward the raw input. */
export function streamline(points: InkPoint[], amount = 0.45): InkPoint[] {
  if (points.length < 3) return points.slice()
  const out: InkPoint[] = [points[0]]
  for (let i = 1; i < points.length; i++) {
    const [px, py] = out[i - 1]
    const [x, y, t, p] = points[i]
    out.push([lerp(x, px, amount), lerp(y, py, amount), t, p])
  }
  out[out.length - 1] = points[points.length - 1]
  return out
}

/** Per-point pressure: the pen's own when it has one, else from speed. */
export function pressures(points: InkPoint[]): number[] {
  const out: number[] = []
  let prev = 0.6
  for (let i = 0; i < points.length; i++) {
    const [x, y, t, p] = points[i]
    if (p >= 0) {
      out.push(clamp(p, 0.05, 1))
      continue
    }
    if (i === 0) {
      out.push(prev)
      continue
    }
    const [px, py, pt] = points[i - 1]
    const speed = Math.hypot(x - px, y - py) / Math.max(1, t - pt)
    prev = lerp(prev, clamp(1 - speed / 2.5, 0.2, 1), 0.35)
    out.push(prev)
  }
  return out
}

/** Smooth path through points: quadratic curves via the midpoints. */
function curve(pts: Point[], move = true): string {
  if (!pts.length) return ""
  let d = move ? `M${r1(pts[0].x)} ${r1(pts[0].y)}` : `L${r1(pts[0].x)} ${r1(pts[0].y)}`
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2
    const my = (pts[i].y + pts[i + 1].y) / 2
    d += `Q${r1(pts[i].x)} ${r1(pts[i].y)} ${r1(mx)} ${r1(my)}`
  }
  if (pts.length > 1) d += `L${r1(pts[pts.length - 1].x)} ${r1(pts[pts.length - 1].y)}`
  return d
}

/** The ink stroke as a filled outline of variable width with round, tapered
 * ends. A single point is a dot. */
export function inkOutline(raw: InkPoint[], width: number): string {
  const points = streamline(raw)
  if (!points.length) return ""
  const press = pressures(points)
  const n = points.length
  if (n === 1 || points.every(([x, y]) => Math.hypot(x - points[0][0], y - points[0][1]) < 0.5)) {
    const r = r1((width / 2) * (0.6 + 0.4 * press[0]))
    const [x, y] = points[0]
    return `M${r1(x - r)} ${r1(y)}a${r} ${r} 0 1 0 ${r1(2 * r)} 0a${r} ${r} 0 1 0 ${r1(-2 * r)} 0Z`
  }
  const taper = Math.min(4, Math.floor(n / 3))
  const left: Point[] = []
  const rightSide: Point[] = []
  const radii: number[] = []
  for (let i = 0; i < n; i++) {
    const [ax, ay] = points[Math.max(0, i - 1)]
    const [bx, by] = points[Math.min(n - 1, i + 1)]
    const len = Math.hypot(bx - ax, by - ay) || 1
    const nx = -(by - ay) / len
    const ny = (bx - ax) / len
    const ends = taper ? Math.min(1, (i + 1) / (taper + 1), (n - i) / (taper + 1)) : 1
    const r = Math.max(0.35, (width / 2) * (0.4 + 0.6 * press[i]) * (0.45 + 0.55 * ends))
    radii.push(r)
    const [x, y] = points[i]
    left.push({ x: x + nx * r, y: y + ny * r })
    rightSide.push({ x: x - nx * r, y: y - ny * r })
  }
  const end = rightSide[n - 1]
  const start = left[0]
  return (
    curve(left) +
    `A${r1(radii[n - 1])} ${r1(radii[n - 1])} 0 0 1 ${r1(end.x)} ${r1(end.y)}` +
    curve(rightSide.reverse(), false) +
    `A${r1(radii[0])} ${r1(radii[0])} 0 0 1 ${r1(start.x)} ${r1(start.y)}Z`
  )
}

/** The marker's centre line (stroked flat by the renderer). */
export function centerline(raw: InkPoint[]): string {
  const points = streamline(raw)
  if (points.length === 1) {
    const [x, y] = points[0]
    return `M${r1(x)} ${r1(y)}l0.01 0`
  }
  return curve(points.map(([x, y]) => ({ x, y })))
}

/** Distance from p to the segment a–b. */
export function toSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = dx * dx + dy * dy
  const t = len ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / len, 0, 1) : 0
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

/** Whether a polyline passes within `tolerance` of p. */
export function hitLine(points: Point[], p: Point, tolerance: number): boolean {
  if (points.length === 1) return Math.hypot(p.x - points[0].x, p.y - points[0].y) <= tolerance
  for (let i = 1; i < points.length; i++) if (toSegment(p, points[i - 1], points[i]) <= tolerance) return true
  return false
}

/** The stroke with every point inside the eraser's circle removed: the runs
 * that remain (none when it is gone entirely, one when untouched). */
export function erase(points: InkPoint[], center: Point, radius: number): InkPoint[][] {
  const runs: InkPoint[][] = []
  let run: InkPoint[] = []
  for (const pt of points) {
    if (Math.hypot(pt[0] - center.x, pt[1] - center.y) <= radius) {
      if (run.length) runs.push(run)
      run = []
    } else run.push(pt)
  }
  if (run.length) runs.push(run)
  return runs
}

export function boundsOf(points: Point[], pad = 0): Box {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const x = Math.min(...xs) - pad
  const y = Math.min(...ys) - pad
  return { x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y }
}

/** An arrow from `a` to `b`: the shaft (ending at the head's base) and the
 * head as a closed triangle, sized by the stroke width. */
export function arrowPaths(a: Point, b: Point, width: number): { shaft: string; head: string } {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
  const ux = (b.x - a.x) / len
  const uy = (b.y - a.y) / len
  const size = Math.min(len * 0.6, 6 + width * 3)
  const bx = b.x - ux * size
  const by = b.y - uy * size
  const half = size * 0.55
  return {
    shaft: `M${r1(a.x)} ${r1(a.y)}L${r1(bx)} ${r1(by)}`,
    head: `M${r1(b.x)} ${r1(b.y)}L${r1(bx - uy * half)} ${r1(by + ux * half)}L${r1(bx + uy * half)} ${r1(by - ux * half)}Z`,
  }
}
