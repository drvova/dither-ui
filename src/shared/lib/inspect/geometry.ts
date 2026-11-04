// Plane geometry in stage pixels: boxes, the distances between two of them
// as drawable segments (the Alt measurement), and snapping.

export type Point = { x: number; y: number }
export type Box = { x: number; y: number; w: number; h: number }

/** A measured length to draw: a solid segment with its value, or a dashed
 * extension that carries an edge across to where the segment lands. */
export type Segment = { x1: number; y1: number; x2: number; y2: number; value: number; dashed?: boolean }

export const right = (b: Box) => b.x + b.w
export const bottom = (b: Box) => b.y + b.h

export function boxFrom(a: Point, b: Point): Box {
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) }
}

export const contains = (outer: Box, inner: Box) =>
  inner.x >= outer.x && inner.y >= outer.y && right(inner) <= right(outer) && bottom(inner) <= bottom(outer)

export const intersects = (a: Box, b: Box) => a.x < right(b) && b.x < right(a) && a.y < bottom(b) && b.y < bottom(a)

export const inside = (p: Point, b: Box) => p.x >= b.x && p.x <= right(b) && p.y >= b.y && p.y <= bottom(b)

const round = (v: number) => Math.round(v * 10) / 10

/** Distances from `a` to `b` as segments. Nested boxes measure the four
 * insets; separate boxes measure the gap on each axis (at the middle of
 * their shared span, or with dashed extensions when they share none);
 * overlapping boxes measure the offsets of their matching edges. */
export function distances(a: Box, b: Box): Segment[] {
  const out: Segment[] = []
  const nested = contains(b, a) ? [a, b] : contains(a, b) ? [b, a] : null
  if (nested) {
    const [i, o] = nested
    const cx = i.x + i.w / 2
    const cy = i.y + i.h / 2
    if (i.y > o.y) out.push({ x1: cx, y1: o.y, x2: cx, y2: i.y, value: round(i.y - o.y) })
    if (bottom(o) > bottom(i))
      out.push({ x1: cx, y1: bottom(i), x2: cx, y2: bottom(o), value: round(bottom(o) - bottom(i)) })
    if (i.x > o.x) out.push({ x1: o.x, y1: cy, x2: i.x, y2: cy, value: round(i.x - o.x) })
    if (right(o) > right(i)) out.push({ x1: right(i), y1: cy, x2: right(o), y2: cy, value: round(right(o) - right(i)) })
    return out
  }
  if (intersects(a, b)) {
    const top = Math.max(a.y, b.y)
    const left = Math.max(a.x, b.x)
    const pairs: [number, number, "x" | "y"][] = [
      [a.x, b.x, "x"],
      [right(a), right(b), "x"],
      [a.y, b.y, "y"],
      [bottom(a), bottom(b), "y"],
    ]
    for (const [p, q, axis] of pairs) {
      if (p === q) continue
      out.push(
        axis === "x"
          ? { x1: Math.min(p, q), y1: top + 1, x2: Math.max(p, q), y2: top + 1, value: round(Math.abs(p - q)) }
          : { x1: left + 1, y1: Math.min(p, q), x2: left + 1, y2: Math.max(p, q), value: round(Math.abs(p - q)) },
      )
    }
    return out
  }
  // Horizontal gap.
  const [l, r] = right(a) <= b.x ? [a, b] : right(b) <= a.x ? [b, a] : [null, null]
  if (l && r) {
    const lo = Math.max(l.y, r.y)
    const hi = Math.min(bottom(l), bottom(r))
    const y = hi > lo ? (lo + hi) / 2 : l.y + l.h / 2
    out.push({ x1: right(l), y1: y, x2: r.x, y2: y, value: round(r.x - right(l)) })
    if (hi <= lo) {
      const ey = Math.min(Math.max(y, r.y), bottom(r))
      out.push({ x1: r.x, y1: ey, x2: r.x, y2: y, value: 0, dashed: true })
    }
  }
  // Vertical gap.
  const [t, btm] = bottom(a) <= b.y ? [a, b] : bottom(b) <= a.y ? [b, a] : [null, null]
  if (t && btm) {
    const lo = Math.max(t.x, btm.x)
    const hi = Math.min(right(t), right(btm))
    const x = hi > lo ? (lo + hi) / 2 : t.x + t.w / 2
    out.push({ x1: x, y1: bottom(t), x2: x, y2: btm.y, value: round(btm.y - bottom(t)) })
    if (hi <= lo) {
      const ex = Math.min(Math.max(x, btm.x), right(btm))
      out.push({ x1: ex, y1: btm.y, x2: x, y2: btm.y, value: 0, dashed: true })
    }
  }
  return out
}

/** The candidate nearest to `v` within `threshold`, else `v` itself. */
export function snap(v: number, candidates: number[], threshold: number): { value: number; to: number | null } {
  let best: number | null = null
  for (const c of candidates)
    if (Math.abs(c - v) <= threshold && (best === null || Math.abs(c - v) < Math.abs(best - v))) best = c
  return { value: best ?? v, to: best }
}

/** The x and y lines a box offers to snap to: its edges and centre. */
export function edgesOf(b: Box): { xs: number[]; ys: number[] } {
  return { xs: [b.x, b.x + b.w / 2, right(b)], ys: [b.y, b.y + b.h / 2, bottom(b)] }
}

/** The point on a box's outline (or its centre) nearest to `p`, within
 * `threshold`; null when none is that close. Arrows dock to it. */
export function dock(p: Point, boxes: Box[], threshold: number): Point | null {
  let best: Point | null = null
  let dist = threshold
  for (const b of boxes) {
    const candidates: Point[] = [
      { x: b.x + b.w / 2, y: b.y + b.h / 2 },
      { x: Math.min(Math.max(p.x, b.x), right(b)), y: b.y },
      { x: Math.min(Math.max(p.x, b.x), right(b)), y: bottom(b) },
      { x: b.x, y: Math.min(Math.max(p.y, b.y), bottom(b)) },
      { x: right(b), y: Math.min(Math.max(p.y, b.y), bottom(b)) },
    ]
    for (const c of candidates) {
      const d = Math.hypot(c.x - p.x, c.y - p.y)
      if (d <= dist) {
        dist = d
        best = c
      }
    }
  }
  return best
}
