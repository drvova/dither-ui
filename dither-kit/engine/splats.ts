// Gaussian splats: a capture as a cloud of 3D Gaussians (a position, an
// ellipsoid's covariance, a colour and an opacity each), read from the two
// files captures ship as (the 32-byte `.splat` record and the training
// PLY), and composited onto the world's cell target: each Gaussian
// projected to its 2D footprint, the cloud sorted by depth and laid front to
// back until a cell is opaque. Its colour lands as a palette index in a
// colour cube and its luminance as the cell's shade, so the shared dither
// pass prints a capture as it prints a mesh. Seekable: a view prints the
// same however it was reached.

/** A cloud of Gaussians, world space. */
export type SplatCloud = {
  count: number
  /** xyz per splat. */
  positions: Float32Array
  /** The ellipsoid per splat as its covariance: xx, xy, xz, yy, yz, zz. */
  cov: Float32Array
  /** rgb per splat, 0-1. */
  colors: Float32Array
  /** 0-1 per splat. */
  opacity: Float32Array
  /** Where the colour cube starts in the world's palette. */
  base: number
}

/** The most splats a cloud keeps: past it every k-th is kept, so a big
 * capture prints in the same time as a small one. */
export const MAX_SPLATS = 150_000
/** Levels per channel of the colour cube a splat cell's colour snaps to. */
export const SPLAT_LEVELS = 6
/** The share of a cell a capture must cover before it prints. */
export const SPLAT_COVER = 0.2

/** The palette entries of the colour cube, in index order (r slowest). */
export function splatCube(): [number, number, number][] {
  const out: [number, number, number][] = []
  const step = 255 / (SPLAT_LEVELS - 1)
  for (let r = 0; r < SPLAT_LEVELS; r++)
    for (let g = 0; g < SPLAT_LEVELS; g++)
      for (let b = 0; b < SPLAT_LEVELS; b++)
        out.push([Math.round(r * step), Math.round(g * step), Math.round(b * step)])
  return out
}

/** The cube entry nearest an rgb (0-1), from the cube's start. */
export function cubeIndex(r: number, g: number, b: number): number {
  const q = (v: number) => Math.max(0, Math.min(SPLAT_LEVELS - 1, Math.round(v * (SPLAT_LEVELS - 1))))
  return q(r) * SPLAT_LEVELS * SPLAT_LEVELS + q(g) * SPLAT_LEVELS + q(b)
}

/** The covariance of an ellipsoid with axis `scale` turned by the unit
 * quaternion (w, x, y, z): R S S R^T, into `out` at `o`. */
export function covariance(
  sx: number,
  sy: number,
  sz: number,
  w: number,
  x: number,
  y: number,
  z: number,
  out: Float32Array,
  o: number,
): void {
  const n = Math.hypot(w, x, y, z) || 1
  w /= n
  x /= n
  y /= n
  z /= n
  // the rotation's rows, each column scaled by its axis
  const m00 = (1 - 2 * (y * y + z * z)) * sx
  const m01 = 2 * (x * y - w * z) * sy
  const m02 = 2 * (x * z + w * y) * sz
  const m10 = 2 * (x * y + w * z) * sx
  const m11 = (1 - 2 * (x * x + z * z)) * sy
  const m12 = 2 * (y * z - w * x) * sz
  const m20 = 2 * (x * z - w * y) * sx
  const m21 = 2 * (y * z + w * x) * sy
  const m22 = (1 - 2 * (x * x + y * y)) * sz
  out[o] = m00 * m00 + m01 * m01 + m02 * m02
  out[o + 1] = m00 * m10 + m01 * m11 + m02 * m12
  out[o + 2] = m00 * m20 + m01 * m21 + m02 * m22
  out[o + 3] = m10 * m10 + m11 * m11 + m12 * m12
  out[o + 4] = m10 * m20 + m11 * m21 + m12 * m22
  out[o + 5] = m20 * m20 + m21 * m21 + m22 * m22
}

/** An empty cloud of `count` splats. */
export function createCloud(count: number, base = 0): SplatCloud {
  return {
    count,
    positions: new Float32Array(count * 3),
    cov: new Float32Array(count * 6),
    colors: new Float32Array(count * 3),
    opacity: new Float32Array(count),
    base,
  }
}

/** Every k-th of `total` records, so at most MAX_SPLATS are kept. */
const strideOf = (total: number) => Math.max(1, Math.ceil(total / MAX_SPLATS))

/** The 32-byte `.splat` record: position and scale as float32 triples, rgba
 * as bytes (the alpha its opacity), the rotation as four bytes (w, x, y, z
 * around 128). */
export function parseSplat(bytes: Uint8Array): SplatCloud {
  const total = Math.floor(bytes.length / 32)
  const stride = strideOf(total)
  const cloud = createCloud(Math.ceil(total / stride))
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  for (let i = 0, k = 0; i < total; i += stride, k++) {
    const o = i * 32
    for (let a = 0; a < 3; a++) cloud.positions[k * 3 + a] = view.getFloat32(o + a * 4, true)
    const q = (j: number) => (bytes[o + 28 + j] - 128) / 128
    covariance(
      view.getFloat32(o + 12, true),
      view.getFloat32(o + 16, true),
      view.getFloat32(o + 20, true),
      q(0),
      q(1),
      q(2),
      q(3),
      cloud.cov,
      k * 6,
    )
    for (let a = 0; a < 3; a++) cloud.colors[k * 3 + a] = bytes[o + 24 + a] / 255
    cloud.opacity[k] = bytes[o + 27] / 255
  }
  return cloud
}

/** The degree-0 spherical harmonic: a training PLY's colour is 0.5 + this times f_dc. */
export const SH_C0 = 0.28209479177387814

/** The properties a training PLY's vertex carries (any order, any others ignored). */
export const SPLAT_PLY_PROPS = [
  "x",
  "y",
  "z",
  "f_dc_0",
  "f_dc_1",
  "f_dc_2",
  "opacity",
  "scale_0",
  "scale_1",
  "scale_2",
  "rot_0",
  "rot_1",
  "rot_2",
  "rot_3",
] as const

/** A binary training PLY's vertex element: `offsets` maps each of
 * SPLAT_PLY_PROPS to its byte offset in a `size`-byte float32 record (the
 * caller has checked they are all float32). Opacity is a logit, scale a
 * log, the rotation w, x, y, z. */
export function splatsFromPly(
  bytes: Uint8Array,
  start: number,
  count: number,
  size: number,
  offsets: Record<(typeof SPLAT_PLY_PROPS)[number], number>,
  little: boolean,
): SplatCloud {
  const total = Math.max(0, Math.min(count, Math.floor((bytes.length - start) / size)))
  const stride = strideOf(total)
  const cloud = createCloud(Math.ceil(total / stride))
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  for (let i = 0, k = 0; i < total; i += stride, k++) {
    const o = start + i * size
    const f = (p: (typeof SPLAT_PLY_PROPS)[number]) => view.getFloat32(o + offsets[p], little)
    cloud.positions[k * 3] = f("x")
    cloud.positions[k * 3 + 1] = f("y")
    cloud.positions[k * 3 + 2] = f("z")
    covariance(
      Math.exp(f("scale_0")),
      Math.exp(f("scale_1")),
      Math.exp(f("scale_2")),
      f("rot_0"),
      f("rot_1"),
      f("rot_2"),
      f("rot_3"),
      cloud.cov,
      k * 6,
    )
    cloud.colors[k * 3] = Math.max(0, Math.min(1, 0.5 + SH_C0 * f("f_dc_0")))
    cloud.colors[k * 3 + 1] = Math.max(0, Math.min(1, 0.5 + SH_C0 * f("f_dc_1")))
    cloud.colors[k * 3 + 2] = Math.max(0, Math.min(1, 0.5 + SH_C0 * f("f_dc_2")))
    cloud.opacity[k] = 1 / (1 + Math.exp(-f("opacity")))
  }
  return cloud
}

/** Turn a cloud by the rotation `r` (row-major 3x3): positions R p, each
 * covariance R C R^T. */
export function rotateCloud(cloud: SplatCloud, r: readonly number[]): void {
  const p = cloud.positions
  const c = cloud.cov
  for (let i = 0; i < cloud.count; i++) {
    const x = p[i * 3]
    const y = p[i * 3 + 1]
    const z = p[i * 3 + 2]
    p[i * 3] = r[0] * x + r[1] * y + r[2] * z
    p[i * 3 + 1] = r[3] * x + r[4] * y + r[5] * z
    p[i * 3 + 2] = r[6] * x + r[7] * y + r[8] * z
    const o = i * 6
    const m = [c[o], c[o + 1], c[o + 2], c[o + 1], c[o + 3], c[o + 4], c[o + 2], c[o + 4], c[o + 5]]
    const rm = [0, 0, 0, 0, 0, 0, 0, 0, 0]
    for (let a = 0; a < 3; a++)
      for (let b = 0; b < 3; b++) rm[a * 3 + b] = r[a * 3] * m[b] + r[a * 3 + 1] * m[3 + b] + r[a * 3 + 2] * m[6 + b]
    const out = (a: number, b: number) =>
      rm[a * 3] * r[b * 3] + rm[a * 3 + 1] * r[b * 3 + 1] + rm[a * 3 + 2] * r[b * 3 + 2]
    c[o] = out(0, 0)
    c[o + 1] = out(0, 1)
    c[o + 2] = out(0, 2)
    c[o + 3] = out(1, 1)
    c[o + 4] = out(1, 2)
    c[o + 5] = out(2, 2)
  }
}

/** The cloud's box without its stray splats: per axis, the span between the
 * 2nd and 98th percentile of a sample. Null for an empty cloud. */
export function cloudBounds(cloud: SplatCloud): { min: number[]; max: number[] } | null {
  if (!cloud.count) return null
  const step = Math.max(1, Math.floor(cloud.count / 20_000))
  const min: number[] = []
  const max: number[] = []
  for (let a = 0; a < 3; a++) {
    const xs: number[] = []
    for (let i = 0; i < cloud.count; i += step) xs.push(cloud.positions[i * 3 + a])
    xs.sort((p, q) => p - q)
    min.push(xs[Math.floor((xs.length - 1) * 0.02)])
    max.push(xs[Math.ceil((xs.length - 1) * 0.98)])
  }
  return { min, max }
}

/** What compositing needs of the orbit camera (world.ts `Camera` + the world's centre). */
export type SplatView = {
  cols: number
  rows: number
  dist: number
  span: number
  scale: number
  cy: number
  sy: number
  cp: number
  sp: number
  center: readonly number[]
}

/** What compositing writes: world.ts `WorldTarget`'s cells. */
export type SplatTarget = {
  width: number
  height: number
  shade: Float32Array
  depth: Float32Array
  index: Uint8Array
  uv: Float32Array
}

let order = new Uint32Array(0)
let keys = new Uint16Array(0)
let screen = new Float32Array(0)
const BUCKETS = 65536

/**
 * Lay the cloud on the target: each splat's covariance turned into camera
 * space and projected through the perspective's Jacobian to a 2D footprint
 * (with a cell's worth of blur, so a splat never falls between cells), the
 * cloud ordered near to far (a counting sort on the depth), and each cell
 * filled front to back until it is opaque or reaches a mesh drawn nearer.
 * A cell the capture covers takes its colour's cube entry and its
 * luminance as the shade; its depth is where it became half opaque.
 */
export function compositeSplats(cloud: SplatCloud, v: SplatView, target: SplatTarget): void {
  const { cols, rows } = v
  const cells = cols * rows
  if (!cloud.count || cols < 1 || rows < 1) return
  const n = cloud.count
  if (screen.length < n * 8) {
    screen = new Float32Array(n * 8)
    keys = new Uint16Array(n)
    order = new Uint32Array(n)
  }
  // the camera's rotation, rows (world to camera): yaw about y, then pitch about x
  const r0 = [v.cy, 0, v.sy]
  const r1 = [v.sy * v.sp, v.cp, -v.cy * v.sp]
  const r2 = [-v.sy * v.cp, v.sp, v.cy * v.cp]
  const near = v.span * 1e-3
  const far = v.dist + v.span
  const cap = Math.max(cols, rows) / 2
  let live = 0
  for (let i = 0; i < n; i++) {
    const px = cloud.positions[i * 3] - v.center[0]
    const py = cloud.positions[i * 3 + 1] - v.center[1]
    const pz = cloud.positions[i * 3 + 2] - v.center[2]
    const x = r0[0] * px + r0[2] * pz
    const y = r1[0] * px + r1[1] * py + r1[2] * pz
    const d = v.dist - (r2[0] * px + r2[1] * py + r2[2] * pz)
    if (d < near || cloud.opacity[i] < 1 / 255) continue
    const inv = v.scale / d
    const sx = cols / 2 + x * inv
    const sy = rows / 2 - y * inv
    // camera-space covariance W C W^T
    const o = i * 6
    const c = cloud.cov
    const m = [c[o], c[o + 1], c[o + 2], c[o + 1], c[o + 3], c[o + 4], c[o + 2], c[o + 4], c[o + 5]]
    const w = [r0, r1, [-r2[0], -r2[1], -r2[2]]] // the depth axis points away from the eye
    const wm = (a: number, b: number) => w[a][0] * m[b] + w[a][1] * m[3 + b] + w[a][2] * m[6 + b]
    const cc = (a: number, b: number) => wm(a, 0) * w[b][0] + wm(a, 1) * w[b][1] + wm(a, 2) * w[b][2]
    // the Jacobian of (x, y, d) to screen cells: u = x s/d, v = -y s/d
    const j00 = inv
    const j02 = (-x * inv) / d
    const j11 = -inv
    const j12 = (y * inv) / d
    const cxx = cc(0, 0)
    const cxy = cc(0, 1)
    const cxd = cc(0, 2)
    const cyy = cc(1, 1)
    const cyd = cc(1, 2)
    const cdd = cc(2, 2)
    const a = j00 * j00 * cxx + 2 * j00 * j02 * cxd + j02 * j02 * cdd + 0.3
    const b = j00 * j11 * cxy + j00 * j12 * cxd + j02 * j11 * cyd + j02 * j12 * cdd
    const cY = j11 * j11 * cyy + 2 * j11 * j12 * cyd + j12 * j12 * cdd + 0.3
    const det = a * cY - b * b
    if (det <= 0) continue
    const mid = (a + cY) / 2
    const radius = Math.min(cap, 3 * Math.sqrt(mid + Math.sqrt(Math.max(0.1, mid * mid - det))))
    if (sx + radius < 0 || sx - radius > cols || sy + radius < 0 || sy - radius > rows) continue
    const s = live * 8
    screen[s] = sx
    screen[s + 1] = sy
    screen[s + 2] = cY / det // the conic: the inverse of the 2D covariance
    screen[s + 3] = -b / det
    screen[s + 4] = a / det
    screen[s + 5] = radius
    screen[s + 6] = d
    screen[s + 7] = i
    keys[live] = Math.round(Math.max(0, Math.min(1, d / far)) * (BUCKETS - 1))
    live++
  }
  // near to far: a counting sort on the quantized depth
  const counts = new Uint32Array(BUCKETS + 1)
  for (let k = 0; k < live; k++) counts[keys[k] + 1]++
  for (let k = 0; k < BUCKETS; k++) counts[k + 1] += counts[k]
  for (let k = 0; k < live; k++) order[counts[keys[k]]++] = k

  const trans = new Float32Array(cells).fill(1)
  const acc = new Float32Array(cells * 3)
  const half = new Float32Array(cells).fill(Infinity)
  const zbuf = target.depth
  for (let k = 0; k < live; k++) {
    const s = order[k] * 8
    const sx = screen[s]
    const sy = screen[s + 1]
    const ca = screen[s + 2]
    const cb = screen[s + 3]
    const cc = screen[s + 4]
    const radius = screen[s + 5]
    const d = screen[s + 6]
    const i = screen[s + 7]
    const op = cloud.opacity[i]
    const cr = cloud.colors[i * 3]
    const cg = cloud.colors[i * 3 + 1]
    const cbl = cloud.colors[i * 3 + 2]
    const x0 = Math.max(0, Math.floor(sx - radius))
    const x1 = Math.min(cols - 1, Math.ceil(sx + radius))
    const y0 = Math.max(0, Math.floor(sy - radius))
    const y1 = Math.min(rows - 1, Math.ceil(sy + radius))
    for (let y = y0; y <= y1; y++) {
      const dy = y + 0.5 - sy
      for (let x = x0; x <= x1; x++) {
        const cell = y * cols + x
        const t = trans[cell]
        if (t < 0.004 || d >= zbuf[cell]) continue
        const dx = x + 0.5 - sx
        const power = -0.5 * (ca * dx * dx + 2 * cb * dx * dy + cc * dy * dy)
        if (power > 0) continue
        const alpha = Math.min(0.99, op * Math.exp(power))
        if (alpha < 1 / 255) continue
        const wgt = t * alpha
        acc[cell * 3] += wgt * cr
        acc[cell * 3 + 1] += wgt * cg
        acc[cell * 3 + 2] += wgt * cbl
        trans[cell] = t * (1 - alpha)
        if (t >= 0.5 && trans[cell] < 0.5) half[cell] = d
      }
    }
  }
  for (let cell = 0; cell < cells; cell++) {
    const cover = 1 - trans[cell]
    if (cover < SPLAT_COVER || (target.index[cell] && cover < 0.5)) continue
    const r = acc[cell * 3] / cover
    const g = acc[cell * 3 + 1] / cover
    const b = acc[cell * 3 + 2] / cover
    target.index[cell] = cloud.base + cubeIndex(r, g, b) + 1
    target.shade[cell] = Math.min(1, (0.2126 * r + 0.7152 * g + 0.0722 * b) ** 0.8 * Math.min(1, cover * 1.25))
    target.depth[cell] = Number.isFinite(half[cell]) ? half[cell] : Math.min(target.depth[cell], v.dist)
    target.uv[cell * 2] = -1
    target.uv[cell * 2 + 1] = 0
  }
}
