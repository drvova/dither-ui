// An SVG's geometry as numbers (`svg.ts`, `svg-motion.ts`): points and
// rings, the 2D affine a `transform` list makes, and a path's `d` flattened
// into rings, its curves cut by size.

export type Pt = [number, number]
export type Ring = Pt[]
/** A 2D affine transform: x' = a x + c y + e, y' = b x + d y + f. */
export type Affine = [number, number, number, number, number, number]
export const IDENTITY: Affine = [1, 0, 0, 1, 0, 0]

export const mul = (m: Affine, n: Affine): Affine => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
]
export const apply = (m: Affine, [x, y]: Pt): Pt => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]

export const nums = (s: string) => (s.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? []).map(Number)

/** An SVG `transform` list. */
export function parseTransform(s: string | undefined): Affine {
  let m = IDENTITY
  for (const [, op, args] of (s ?? "").matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const v = nums(args)
    const rad = ((v[0] ?? 0) * Math.PI) / 180
    const t: Affine | null =
      op === "matrix" && v.length >= 6
        ? [v[0], v[1], v[2], v[3], v[4], v[5]]
        : op === "translate"
          ? [1, 0, 0, 1, v[0] ?? 0, v[1] ?? 0]
          : op === "scale"
            ? [v[0] ?? 1, 0, 0, v[1] ?? v[0] ?? 1, 0, 0]
            : op === "rotate"
              ? mul(
                  mul(
                    [1, 0, 0, 1, v[1] ?? 0, v[2] ?? 0],
                    [Math.cos(rad), Math.sin(rad), -Math.sin(rad), Math.cos(rad), 0, 0],
                  ),
                  [1, 0, 0, 1, -(v[1] ?? 0), -(v[2] ?? 0)],
                )
              : op === "skewX"
                ? [1, 0, Math.tan(rad), 1, 0, 0]
                : op === "skewY"
                  ? [1, Math.tan(rad), 0, 1, 0, 0]
                  : null
    if (t) m = mul(m, t)
  }
  return m
}

// ---- outlines -----------------------------------------------------------------------

/** Segments a curve of this (control polygon) length is cut into. */
const steps = (len: number, tol: number) => Math.max(2, Math.min(64, Math.ceil(Math.sqrt(len / tol) * 2)))
export const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1])

/** A path's `d` as flattened subpaths, each flagged closed or open. `tol`
 * is the drawing's size over which a curve's cut stays invisible. */
export function flattenPath(d: string, tol = 0.25): { ring: Ring; closed: boolean }[] {
  const out: { ring: Ring; closed: boolean }[] = []
  const toks = d.match(/[a-df-z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? []
  let i = 0
  let cmd = ""
  let cur: Pt = [0, 0]
  let start: Pt = [0, 0]
  let ring: Ring = []
  let ctrl: Pt | null = null
  let prev = ""
  const num = () => +toks[i++]
  const flag = () => {
    // arc flags may be written without separators ("a1 1 0 011 1")
    const t = toks[i]
    if (t.length > 1 && (t[0] === "0" || t[0] === "1")) {
      toks[i] = t.slice(1)
      return t[0] === "1"
    }
    i++
    return t === "1"
  }
  const end = (closed: boolean) => {
    if (ring.length > 1) out.push({ ring, closed })
    ring = []
  }
  const line = (p: Pt) => {
    if (!ring.length) ring.push(cur)
    ring.push(p)
    cur = p
  }
  const cubic = (c1: Pt, c2: Pt, p: Pt) => {
    const n = steps(dist(cur, c1) + dist(c1, c2) + dist(c2, p), tol)
    const p0 = cur
    for (let k = 1; k <= n; k++) {
      const t = k / n
      const u = 1 - t
      line([
        u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p[0],
        u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p[1],
      ])
    }
    ctrl = c2
  }
  const quad = (c: Pt, p: Pt) => {
    const n = steps(dist(cur, c) + dist(c, p), tol)
    const p0 = cur
    for (let k = 1; k <= n; k++) {
      const t = k / n
      const u = 1 - t
      line([u * u * p0[0] + 2 * u * t * c[0] + t * t * p[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p[1]])
    }
    ctrl = c
  }
  const arc = (rx: number, ry: number, phi: number, large: boolean, sweep: boolean, p: Pt) => {
    rx = Math.abs(rx)
    ry = Math.abs(ry)
    if (!rx || !ry) return line(p)
    // the endpoint form to the centre form (SVG 1.1, F.6.5)
    const cos = Math.cos(phi)
    const sin = Math.sin(phi)
    const dx = (cur[0] - p[0]) / 2
    const dy = (cur[1] - p[1]) / 2
    const x1 = cos * dx + sin * dy
    const y1 = -sin * dx + cos * dy
    const grow = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry)
    if (grow > 1) {
      rx *= Math.sqrt(grow)
      ry *= Math.sqrt(grow)
    }
    const num2 = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1
    const k = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num2 / (rx * rx * y1 * y1 + ry * ry * x1 * x1)))
    const cx1 = (k * rx * y1) / ry
    const cy1 = (-k * ry * x1) / rx
    const cx = cos * cx1 - sin * cy1 + (cur[0] + p[0]) / 2
    const cy = sin * cx1 + cos * cy1 + (cur[1] + p[1]) / 2
    const angle = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
    const t0 = angle(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry)
    let span = angle((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry)
    if (!sweep && span > 0) span -= 2 * Math.PI
    if (sweep && span < 0) span += 2 * Math.PI
    const n = steps(Math.abs(span) * Math.max(rx, ry) * 1.5, tol)
    for (let s = 1; s <= n; s++) {
      const t = t0 + (span * s) / n
      const ex = rx * Math.cos(t)
      const ey = ry * Math.sin(t)
      line(s === n ? p : [cos * ex - sin * ey + cx, sin * ex + cos * ey + cy])
    }
  }
  while (i < toks.length) {
    if (/[a-z]/i.test(toks[i])) cmd = toks[i++]
    else if (!cmd) {
      i++
      continue
    }
    const rel = cmd === cmd.toLowerCase()
    const at = (x: number, y: number): Pt => (rel ? [cur[0] + x, cur[1] + y] : [x, y])
    const C = cmd.toUpperCase()
    const need = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 }[C] ?? 0
    if (C !== "Z" && i + need > toks.length) break
    const reflected = (): Pt => (ctrl && "CSQT".includes(prev) ? [2 * cur[0] - ctrl[0], 2 * cur[1] - ctrl[1]] : cur)
    const smoothOf = (letters: string): Pt => (ctrl && letters.includes(prev) ? reflected() : cur)
    switch (C) {
      case "M":
        end(false)
        cur = at(num(), num())
        start = cur
        // further pairs are lines
        cmd = rel ? "l" : "L"
        break
      case "L":
        line(at(num(), num()))
        break
      case "H":
        line([rel ? cur[0] + num() : num(), cur[1]])
        break
      case "V":
        line([cur[0], rel ? cur[1] + num() : num()])
        break
      case "C": {
        const c1 = at(num(), num())
        const c2 = at(num(), num())
        cubic(c1, c2, at(num(), num()))
        break
      }
      case "S": {
        const c1 = smoothOf("CS")
        const c2 = at(num(), num())
        cubic(c1, c2, at(num(), num()))
        break
      }
      case "Q": {
        const c = at(num(), num())
        quad(c, at(num(), num()))
        break
      }
      case "T":
        quad(smoothOf("QT"), at(num(), num()))
        break
      case "A": {
        const rx = num()
        const ry = num()
        const phi = (num() * Math.PI) / 180
        const large = flag()
        const sweep = flag()
        arc(rx, ry, phi, large, sweep, at(num(), num()))
        break
      }
      case "Z":
        if (ring.length) end(true)
        cur = start
        break
      default:
        i++
    }
    prev = C
    if (!"CSQT".includes(C)) ctrl = null
  }
  end(false)
  // a closed ring does not repeat its first point
  for (const r of out) if (r.ring.length > 1 && dist(r.ring[0], r.ring[r.ring.length - 1]) < 1e-9) r.ring.pop()
  return out.filter((r) => r.ring.length > (r.closed ? 2 : 1))
}
