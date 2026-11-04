// A world as a build: its separate pieces (each connected run of triangles,
// so a panelled or blocky model comes apart along its own seams) raised
// out of a dotted wire cage, shape by shape in the order the file gives
// them, each shape's pieces bottom to top (a flat shape, which has no
// bottom to top, spreads out from its middle), each flying in from beside its
// place and painted hot (its own glowing palette entry) until it lands;
// scattered outward and turned for an explode; nudged away from a point on
// the target for a hand passing over it. `frame` hands the renderer a world
// of plain static meshes for this moment, so either engine and the shared
// paint pass draw it unchanged. Seeded: the same world, seed and state give
// the same bytes.

import { xorshift32 } from "./pixel"
import type { Rgb } from "./palette"
import {
  type Camera,
  nodeMatrices,
  posedPositions,
  screenOf,
  type World,
  type WorldMesh,
  type WorldView,
} from "./world"
import { spring } from "./spring"

/** What a build shows at a moment. */
export type AssemblyState = {
  /** 0 the wire cage alone, 1 every piece in its place. */
  build: number
  /** 0 together, 1 blown apart. */
  scatter: number
  /** A point on the target (cells) pieces lean away from, with its reach in
   * cells and its strength 0-1; null when nothing passes over. */
  nudge: { x: number; y: number; radius: number; amount: number } | null
}

/** The share of the build one piece takes to fly in: wider is softer. */
export const ARRIVAL = 0.22
/** The cage's dots, per world unit of the model's radius. */
const DOTS_PER_RADIUS = 34

type Piece = {
  /** Where it stands, world space. */
  center: [number, number, number]
  /** Its turn in the order (0 first, 1 last): its shape's place in the
   * file, then its height in the shape (or its reach from a flat shape's
   * middle), a little jitter. */
  order: number
  /** Seeded values: flight, scatter, the axis it turns on. */
  rand: [number, number, number]
  axis: [number, number, number]
  /** The pushed amount now, eased toward its target frame by frame. */
  push: number
}

export type Assembly = {
  /** How many pieces the world came apart into. */
  readonly pieces: number
  /** The palette index the pieces in flight paint with (a `glows` entry). */
  readonly hot: number
  /** The world as it stands for this state; `dt` (seconds) eases the nudge. */
  frame(view: WorldView, cam: Camera, state: AssemblyState, dt: number): World
}

/** Each vertex's piece: union-find over the triangles' shared vertices. */
function piecesOfMesh(mesh: WorldMesh): { of: Int32Array; count: number } {
  const n = mesh.positions.length / 3
  const parent = new Int32Array(n)
  for (let i = 0; i < n; i++) parent[i] = i
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]]
      i = parent[i]
    }
    return i
  }
  const join = (a: number, b: number) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent[ra] = rb
  }
  const ix = mesh.indices
  for (let t = 0; t + 2 < ix.length; t += 3) {
    join(ix[t], ix[t + 1])
    join(ix[t + 1], ix[t + 2])
  }
  const of = new Int32Array(n).fill(-1)
  const ids = new Map<number, number>()
  // Only vertices a triangle uses belong to a piece.
  for (let k = 0; k < ix.length; k++) {
    const r = find(ix[k])
    let id = ids.get(r)
    if (id === undefined) ids.set(r, (id = ids.size))
    of[ix[k]] = id
  }
  return { of, count: ids.size }
}

/** Rotation of `v` about a unit axis by `a` radians (Rodrigues), into `out`. */
function turn(v: number[], k: number[], a: number, out: number[]): void {
  const c = Math.cos(a)
  const s = Math.sin(a)
  const d = (k[0] * v[0] + k[1] * v[1] + k[2] * v[2]) * (1 - c)
  out[0] = v[0] * c + (k[1] * v[2] - k[2] * v[1]) * s + k[0] * d
  out[1] = v[1] * c + (k[2] * v[0] - k[0] * v[2]) * s + k[1] * d
  out[2] = v[2] * c + (k[0] * v[1] - k[1] * v[0]) * s + k[2] * d
}

/**
 * Take a world apart into its pieces once; `frame` then poses it per state.
 * `heat` is the colour the pieces in flight glow in (appended to the palette).
 */
export function createAssembly(world: World, heat: Rgb, seed = 0): Assembly {
  const faces = world.meshes.map((m, i) => ({ m, i })).filter(({ m }) => m.kind === "faces")
  const rest = world.meshes.filter((m) => m.kind !== "faces")
  const mats0 = world.nodes.length ? nodeMatrices(world, 0) : null
  const rnd = xorshift32((seed >>> 0) + 0x51ed27)
  const pieces: Piece[] = []
  const vertexPiece: Int32Array[] = []
  /** Each shape's pieces, as [first, end) into `pieces`. */
  const shapes: [number, number][] = []
  for (const { m } of faces) {
    const { of, count } = piecesOfMesh(m)
    const base = pieces.length
    const p = posedPositions(m, mats0)
    const sum = Array.from({ length: count }, () => [0, 0, 0, 0])
    for (let v = 0; v < of.length; v++) {
      if (of[v] < 0) continue
      const s = sum[of[v]]
      s[0] += p[v * 3]
      s[1] += p[v * 3 + 1]
      s[2] += p[v * 3 + 2]
      s[3] += 1
    }
    for (const s of sum) {
      const center: [number, number, number] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]
      const ax = [rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]
      const al = Math.hypot(ax[0], ax[1], ax[2]) || 1
      pieces.push({
        center,
        order: 0,
        rand: [rnd(), rnd(), rnd()],
        axis: [ax[0] / al, ax[1] / al, ax[2] / al],
        push: 0,
      })
    }
    // Global piece ids per vertex.
    vertexPiece.push(of.map((x) => (x < 0 ? -1 : base + x)))
    shapes.push([base, pieces.length])
  }
  shapes.forEach(([a, b], rank) => {
    const own = pieces.slice(a, b)
    if (!own.length) return
    const ys = own.map((p) => p.center[1])
    const low = Math.min(...ys)
    const span = Math.max(...ys) - low
    // A flat shape (a floor, a plate) has no bottom to top: it spreads out
    // from its middle instead.
    const flat = span < (world.radius || 1) * 0.02
    const mid = [0, 1, 2].map((k) => own.reduce((s, p) => s + p.center[k], 0) / own.length)
    const reach = (p: Piece) => Math.hypot(p.center[0] - mid[0], p.center[1] - mid[1], p.center[2] - mid[2])
    const far = flat ? Math.max(...own.map(reach)) || 1 : 1
    for (const p of own) {
      const k = flat ? reach(p) / far : (p.center[1] - low) / (span || 1)
      p.order = Math.min(1, Math.max(0, (rank + k * 0.86 + p.rand[0] * 0.14) / shapes.length))
    }
  })

  const palette = world.palette.length < 255 ? [...world.palette, heat] : [...world.palette.slice(0, 254), heat]
  const hot = palette.length - 1
  /** The heat gives off light; a world full of colours lends it its last entry. */
  const glows = [...world.glows.filter((g) => g < hot), hot]
  const radius = world.radius || 1
  const [cx, cy, cz] = world.center

  // Per-frame buffers, reused.
  const outFaces = faces.map(({ m }) => ({
    positions: new Float32Array(m.positions.length),
    indices: new Uint32Array(m.indices.length),
    triColors: new Uint8Array(m.indices.length / 3),
    edges: new Uint32Array(m.edges.length),
    triMap: new Int32Array(m.indices.length / 3),
  }))
  const t = new Float32Array(pieces.length)
  const offset = new Float32Array(pieces.length * 3)
  const angle = new Float32Array(pieces.length)
  const v = [0, 0, 0]
  const r = [0, 0, 0]

  return {
    pieces: pieces.length,
    hot,
    frame(view, cam, state, dt) {
      const build = Math.min(1, Math.max(0, state.build))
      const scatter = Math.max(0, state.scatter)
      const mats = world.nodes.length ? nodeMatrices(world, view.time ?? 0) : null
      // Each piece's own moment in the build, and where it stands.
      const ease = 1 - Math.exp(-Math.max(0, dt) * 9)
      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i]
        t[i] = Math.min(1, Math.max(0, (build * (1 + ARRIVAL) - p.order) / ARRIVAL))
        const out = [p.center[0] - cx, p.center[1] - cy + radius * 0.35, p.center[2] - cz]
        const ol = Math.hypot(out[0], out[1], out[2]) || 1
        let target = 0
        if (state.nudge && state.nudge.amount > 0) {
          const [sx, sy] = screenOf(cam, world, p.center[0], p.center[1], p.center[2])
          const d = Math.hypot(sx - state.nudge.x, sy - state.nudge.y)
          const k = 1 - Math.min(1, d / Math.max(1, state.nudge.radius))
          target = k * k * (3 - 2 * k) * state.nudge.amount
        }
        p.push += (target - p.push) * (dt > 0 ? ease : 1)
        const fly = 1 - spring(t[i])
        const dist = radius * (fly * (0.55 + 0.5 * p.rand[1]) + scatter * (0.3 + 0.9 * p.rand[1]) + p.push * 0.16)
        offset[i * 3] = (out[0] / ol) * dist
        offset[i * 3 + 1] = (out[1] / ol) * dist
        offset[i * 3 + 2] = (out[2] / ol) * dist
        angle[i] = (fly * 1.4 + scatter * 2.2 + p.push * 0.5) * (p.rand[2] - 0.5) * 2
      }

      const meshes: WorldMesh[] = []
      let cageCount = 0
      const cage: number[] = []
      faces.forEach(({ m }, fi) => {
        const o = outFaces[fi]
        const src = posedPositions(m, mats)
        const of = vertexPiece[fi]
        for (let k = 0; k < of.length; k++) {
          const pi = of[k]
          const b = k * 3
          if (pi < 0) {
            o.positions[b] = src[b]
            o.positions[b + 1] = src[b + 1]
            o.positions[b + 2] = src[b + 2]
            continue
          }
          const p = pieces[pi]
          v[0] = src[b] - p.center[0]
          v[1] = src[b + 1] - p.center[1]
          v[2] = src[b + 2] - p.center[2]
          if (angle[pi] !== 0) turn(v, p.axis, angle[pi], r)
          else r.splice(0, 3, v[0], v[1], v[2])
          o.positions[b] = p.center[0] + r[0] + offset[pi * 3]
          o.positions[b + 1] = p.center[1] + r[1] + offset[pi * 3 + 1]
          o.positions[b + 2] = p.center[2] + r[2] + offset[pi * 3 + 2]
        }
        // The triangles of the pieces that have started; the rest wait as cage.
        let n = 0
        const tc = m.indices.length / 3
        for (let tri = 0; tri < tc; tri++) {
          const pi = of[m.indices[tri * 3]]
          if (pi >= 0 && t[pi] <= 0) {
            o.triMap[tri] = -1
            continue
          }
          o.triMap[tri] = n
          o.indices[n * 3] = m.indices[tri * 3]
          o.indices[n * 3 + 1] = m.indices[tri * 3 + 1]
          o.indices[n * 3 + 2] = m.indices[tri * 3 + 2]
          o.triColors[n] = pi >= 0 && t[pi] < 1 ? hot : m.triColors ? m.triColors[tri] : m.color
          n++
        }
        let e = 0
        for (let k = 0; k + 2 < m.edges.length; k += 3) {
          const tri = o.triMap[m.edges[k + 2]]
          if (tri < 0) {
            // A waiting piece's outline, dotted, where it will stand.
            const a = m.edges[k] * 3
            const z = m.edges[k + 1] * 3
            const len = Math.hypot(src[z] - src[a], src[z + 1] - src[a + 1], src[z + 2] - src[a + 2])
            const steps = Math.max(1, Math.round((len / radius) * DOTS_PER_RADIUS))
            for (let s = 0; s <= steps; s++) {
              const f = s / steps
              cage.push(
                src[a] + (src[z] - src[a]) * f,
                src[a + 1] + (src[z + 1] - src[a + 1]) * f,
                src[a + 2] + (src[z + 2] - src[a + 2]) * f,
              )
              cageCount++
            }
            continue
          }
          o.edges[e] = m.edges[k]
          o.edges[e + 1] = m.edges[k + 1]
          o.edges[e + 2] = tri
          e += 3
        }
        meshes.push({
          ...m,
          positions: o.positions,
          indices: o.indices.subarray(0, n * 3),
          triColors: o.triColors.subarray(0, n),
          edges: o.edges.subarray(0, e),
          // Turned pieces show their backs; nothing is culled mid-build.
          solid: m.solid && build >= 1 && scatter <= 0,
          node: -1,
          scratch: undefined,
          grain: undefined,
          grainKey: undefined,
        })
      })
      for (const m of rest)
        meshes.push({ ...m, positions: new Float32Array(posedPositions(m, mats)), node: -1, scratch: undefined })
      if (cageCount)
        meshes.push({
          positions: new Float32Array(cage),
          indices: Uint32Array.from({ length: cageCount }, (_, i) => i),
          edges: new Uint32Array(0),
          color: faces[0]?.m.color ?? 0,
          triColors: null,
          uv: null,
          solid: false,
          kind: "points",
          node: -1,
        })
      return { ...world, meshes, nodes: [], palette, glows }
    },
  }
}
