// 3D for the dither engine: a scene of meshes under animatable nodes, an orbit
// camera and a two-stage renderer. Stage one rasterizes into a WorldTarget —
// per cell a lighting shade, a depth and a palette index — on the CPU here
// (`rasterizeWorld`, z-buffered flat Lambert) or on the GPU in `world-gl.ts`.
// Stage two (`paintTarget`) is shared: it turns the target into dithered pixels
// through the kit's other engines — the Bayer cell, a palette ramp
// (`sampleRgbGradient`), the file's material colours — then draws outlines,
// line sets and point sets depth-tested against the finished z-buffer. Same
// world + time + view + style → same bytes, in a browser, a worker, Node and a
// HyperFrames capture. Model files are parsed by `models.ts`; `sampleWorld`
// writes the seeded default content as VRML97 text (with its own animation)
// so the default goes through the same parser and the same clock.

import { clamp01, xorshift32 } from "./pixel"
import { hsvToRgb, sampleRgbGradient, type Rgb } from "./palette"
import { fbm } from "./noise"
import type { RasterBuffer } from "./raster"

export type Vec3 = [number, number, number]
/** x, y, z, w. */
export type Quat = [number, number, number, number]
/** Column-major 4x4 acting on column vectors (p' = M p). */
export type Mat4 = number[]

/** Raw geometry before baking: flat xyz triples + index rings (polygons,
 * polylines or point runs by `kind`), optional rgb (0-1) per ring. */
export type Geometry = { points: number[]; faces: number[][]; colors?: number[] }

export type MeshKind = "faces" | "lines" | "points"

export type WorldMesh = {
  /** xyz triples — world space, or node space when `node` is set. */
  positions: Float32Array
  /** Triangles (faces), segments (lines) or vertices (points). */
  indices: Uint32Array
  /** Polygon outline edges as (a, b, owning triangle) triples — faces only;
   * `wire` draws these, never a fan's diagonals. */
  edges: Uint32Array
  /** Palette index of the material colour. */
  color: number
  /** Palette index per triangle when the file colours faces or vertices. */
  triColors: Uint8Array | null
  /** Back faces are culled (the file promised outward winding). */
  solid: boolean
  kind: MeshKind
  /** Index into `World.nodes`, -1 when static (positions are world space). */
  node: number
  /** Posed positions for an animated mesh (renderer scratch). */
  scratch?: Float32Array
  /** Per-vertex noise grain (renderer cache, keyed by seed + scale). */
  grain?: Float32Array
  grainKey?: string
}

/** A keyframe track: keys in seconds, `stride` values per key. */
export type Track = {
  key: number[]
  value: number[]
  stride: 3 | 4
  kind: "lerp" | "slerp" | "step"
  /** Seconds of one cycle (the last key), looping or clamped. */
  duration: number
  loop: boolean
  /** Seconds the cycle starts at. */
  start: number
}

/** An animatable transform (VRML Transform / glTF node) — static `pre`
 * folds the untracked transforms between it and its parent node. */
export type WorldNode = {
  parent: number
  pre: Mat4
  translation: Vec3
  rotation: Quat
  scale: Vec3
  center: Vec3
  scaleOrientation: Quat
  tracks: { translation?: Track; rotation?: Track; scale?: Track }
}

/** A directional light, world space, the direction the light TRAVELS (VRML). */
export type WorldLight = { direction: Vec3; intensity: number }

export type World = {
  meshes: WorldMesh[]
  nodes: WorldNode[]
  /** Material colours, 0-255 — meshes and triangles carry indices (≤ 255). */
  palette: Rgb[]
  lights: WorldLight[]
  /** VRML `NavigationInfo { headlight }`: a light riding the camera. */
  headlight: boolean
  /** The file's first viewpoint: where it stood, vertical field of view in degrees. */
  viewpoint: { position: Vec3; fov: number } | null
  /** Bounding sphere at time 0 — the orbit camera's target and framing. */
  center: Vec3
  radius: number
  /** Seconds until every track has cycled once; 0 for a still world. */
  duration: number
}

// ---- vectors, quaternions, matrices --------------------------------------------

export const mat4Identity = (): Mat4 => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

export function mat4Multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Array<number>(16)
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]
      out[c * 4 + r] = s
    }
  return out
}

export const mat4Translate = ([x, y, z]: Vec3): Mat4 => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]

export const mat4Scale = ([x, y, z]: Vec3): Mat4 => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]

/** Rotation about an axis (any length) by `angle` radians. */
export const mat4Rotate = (axis: Vec3, angle: number): Mat4 => mat4FromQuat(quatFromAxisAngle(axis, angle))

export function mat4FromQuat([x, y, z, w]: Quat): Mat4 {
  const xx = x * x
  const yy = y * y
  const zz = z * z
  const xy = x * y
  const xz = x * z
  const yz = y * z
  const wx = w * x
  const wy = w * y
  const wz = w * z
  return [
    1 - 2 * (yy + zz), 2 * (xy + wz), 2 * (xz - wy), 0,
    2 * (xy - wz), 1 - 2 * (xx + zz), 2 * (yz + wx), 0,
    2 * (xz + wy), 2 * (yz - wx), 1 - 2 * (xx + yy), 0,
    0, 0, 0, 1,
  ]
}

export const QUAT_IDENTITY: Quat = [0, 0, 0, 1]

export function quatFromAxisAngle([ax, ay, az]: Vec3, angle: number): Quat {
  const len = Math.hypot(ax, ay, az)
  if (!len || !angle) return [0, 0, 0, 1]
  const s = Math.sin(angle / 2) / len
  return [ax * s, ay * s, az * s, Math.cos(angle / 2)]
}

export function quatNormalize(q: Quat): Quat {
  const len = Math.hypot(q[0], q[1], q[2], q[3])
  return len ? [q[0] / len, q[1] / len, q[2] / len, q[3] / len] : [0, 0, 0, 1]
}

const quatConjugate = ([x, y, z, w]: Quat): Quat => [-x, -y, -z, w]

/** Shortest-path spherical interpolation. */
export function quatSlerp(a: Quat, b: Quat, t: number): Quat {
  let bx = b[0]
  let by = b[1]
  let bz = b[2]
  let bw = b[3]
  let cos = a[0] * bx + a[1] * by + a[2] * bz + a[3] * bw
  if (cos < 0) {
    cos = -cos
    bx = -bx
    by = -by
    bz = -bz
    bw = -bw
  }
  let ka = 1 - t
  let kb = t
  if (cos < 0.9995) {
    const th = Math.acos(Math.min(1, cos))
    const s = Math.sin(th)
    ka = Math.sin((1 - t) * th) / s
    kb = Math.sin(t * th) / s
  }
  return quatNormalize([a[0] * ka + bx * kb, a[1] * ka + by * kb, a[2] * ka + bz * kb, a[3] * ka + bw * kb])
}

export const transformPoint = (m: Mat4, [x, y, z]: Vec3): Vec3 => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
]

export const transformDirection = (m: Mat4, [x, y, z]: Vec3): Vec3 => [
  m[0] * x + m[4] * y + m[8] * z,
  m[1] * x + m[5] * y + m[9] * z,
  m[2] * x + m[6] * y + m[10] * z,
]

export function normalize([x, y, z]: Vec3): Vec3 {
  const len = Math.hypot(x, y, z)
  return len ? [x / len, y / len, z / len] : [0, 0, 1]
}

/** Determinant of the upper 3x3 — negative means the transform mirrors. */
const det3 = (m: Mat4) =>
  m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2])

/** VRML's Transform: T · C · R · SR · S · -SR · -C (glTF: center and SR identity). */
export function composeTransform(translation: Vec3, rotation: Quat, scale: Vec3, center: Vec3 = [0, 0, 0], scaleOrientation: Quat = QUAT_IDENTITY): Mat4 {
  let m = mat4Translate([translation[0] + center[0], translation[1] + center[1], translation[2] + center[2]])
  m = mat4Multiply(m, mat4FromQuat(rotation))
  const so = scaleOrientation[3] !== 1
  if (so) m = mat4Multiply(m, mat4FromQuat(scaleOrientation))
  m = mat4Multiply(m, mat4Scale(scale))
  if (so) m = mat4Multiply(m, mat4FromQuat(quatConjugate(scaleOrientation)))
  if (center[0] || center[1] || center[2]) m = mat4Multiply(m, mat4Translate([-center[0], -center[1], -center[2]]))
  return m
}

// ---- primitives (VRML conventions: y up, centred on the origin) ----------------

export function boxGeometry([sx, sy, sz]: Vec3): Geometry {
  const x = sx / 2
  const y = sy / 2
  const z = sz / 2
  return {
    points: [-x, -y, z, x, -y, z, x, y, z, -x, y, z, -x, -y, -z, x, -y, -z, x, y, -z, -x, y, -z],
    faces: [[0, 1, 2, 3], [5, 4, 7, 6], [1, 5, 6, 2], [4, 0, 3, 7], [3, 2, 6, 7], [4, 5, 1, 0]],
  }
}

export function sphereGeometry(radius: number, segments = 24, rings = 12): Geometry {
  const points: number[] = [0, radius, 0]
  const faces: number[][] = []
  const at = (ring: number, j: number) => 1 + (ring - 1) * segments + (j % segments)
  for (let i = 1; i < rings; i++) {
    const phi = (Math.PI * i) / rings
    const y = radius * Math.cos(phi)
    const rho = radius * Math.sin(phi)
    for (let j = 0; j < segments; j++) {
      const th = (2 * Math.PI * j) / segments
      points.push(rho * Math.sin(th), y, rho * Math.cos(th))
    }
  }
  const bottom = points.length / 3
  points.push(0, -radius, 0)
  for (let j = 0; j < segments; j++) {
    faces.push([at(1, j), at(1, j + 1), 0])
    for (let i = 1; i < rings - 1; i++) faces.push([at(i + 1, j), at(i + 1, j + 1), at(i, j + 1), at(i, j)])
    faces.push([bottom, at(rings - 1, j + 1), at(rings - 1, j)])
  }
  return { points, faces }
}

export function cylinderGeometry(radius: number, height: number, side = true, top = true, bottom = true, segments = 24): Geometry {
  const points: number[] = []
  const faces: number[][] = []
  const h = height / 2
  for (let j = 0; j < segments; j++) {
    const th = (2 * Math.PI * j) / segments
    points.push(radius * Math.sin(th), h, radius * Math.cos(th), radius * Math.sin(th), -h, radius * Math.cos(th))
  }
  const topAt = (j: number) => (j % segments) * 2
  const botAt = (j: number) => (j % segments) * 2 + 1
  if (side) for (let j = 0; j < segments; j++) faces.push([botAt(j), botAt(j + 1), topAt(j + 1), topAt(j)])
  if (top) faces.push(Array.from({ length: segments }, (_, j) => topAt(j)))
  if (bottom) faces.push(Array.from({ length: segments }, (_, j) => botAt(segments - 1 - j)))
  return { points, faces }
}

export function coneGeometry(bottomRadius: number, height: number, side = true, bottom = true, segments = 24): Geometry {
  const points: number[] = [0, height / 2, 0]
  const faces: number[][] = []
  for (let j = 0; j < segments; j++) {
    const th = (2 * Math.PI * j) / segments
    points.push(bottomRadius * Math.sin(th), -height / 2, bottomRadius * Math.cos(th))
  }
  const at = (j: number) => 1 + (j % segments)
  if (side) for (let j = 0; j < segments; j++) faces.push([at(j), at(j + 1), 0])
  if (bottom) faces.push(Array.from({ length: segments }, (_, j) => at(segments - 1 - j)))
  return { points, faces }
}

/** VRML ElevationGrid: heights row by row along z, `xDimension` per row. */
export function elevationGeometry(xDimension: number, zDimension: number, xSpacing: number, zSpacing: number, heights: number[]): Geometry {
  const points: number[] = []
  const faces: number[][] = []
  for (let j = 0; j < zDimension; j++)
    for (let i = 0; i < xDimension; i++) points.push(i * xSpacing, heights[j * xDimension + i] ?? 0, j * zSpacing)
  const at = (i: number, j: number) => j * xDimension + i
  for (let j = 0; j + 1 < zDimension; j++)
    for (let i = 0; i + 1 < xDimension; i++) faces.push([at(i, j + 1), at(i + 1, j + 1), at(i + 1, j), at(i, j)])
  return { points, faces }
}

// ---- worlds ------------------------------------------------------------------------

export function emptyWorld(): World {
  return { meshes: [], nodes: [], palette: [], lights: [], headlight: true, viewpoint: null, center: [0, 0, 0], radius: 1, duration: 0 }
}

/** Palette index for a colour — at most 255 distinct colours per world, the
 * rest snap to their nearest neighbour. */
export function colorIndex(world: World, rgb: Rgb): number {
  const r = Math.max(0, Math.min(255, Math.round(rgb[0])))
  const g = Math.max(0, Math.min(255, Math.round(rgb[1])))
  const b = Math.max(0, Math.min(255, Math.round(rgb[2])))
  const p = world.palette
  let best = -1
  let bestD = Infinity
  for (let i = 0; i < p.length; i++) {
    const d = (p[i][0] - r) ** 2 + (p[i][1] - g) ** 2 + (p[i][2] - b) ** 2
    if (d === 0) return i
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  if (p.length >= 255) return best
  p.push([r, g, b])
  return p.length - 1
}

/** Add a node (parents first — a node's index is always above its parent's). */
export function addNode(world: World, node: Partial<WorldNode> & { parent: number }): number {
  world.nodes.push({
    pre: mat4Identity(),
    translation: [0, 0, 0],
    rotation: QUAT_IDENTITY,
    scale: [1, 1, 1],
    center: [0, 0, 0],
    scaleOrientation: QUAT_IDENTITY,
    tracks: {},
    ...node,
  })
  return world.nodes.length - 1
}

export type MeshOptions = { kind?: MeshKind; node?: number; ccw?: boolean }

/**
 * Bake geometry into a mesh: transform, enforce outward winding (`ccw` false
 * or a mirroring matrix reverses every ring), fan-triangulate polygons, keep
 * the outlines for the wire pass, register colours in the palette. Lines
 * take rings as polylines, points take them as runs (or every point).
 */
export function addMesh(world: World, geo: Geometry, matrix: Mat4 | null, color: Rgb, solid: boolean, opts: MeshOptions = {}): WorldMesh | null {
  const count = Math.floor(geo.points.length / 3)
  if (!count) return null
  const kind = opts.kind ?? "faces"
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const p: Vec3 = [geo.points[i * 3], geo.points[i * 3 + 1], geo.points[i * 3 + 2]]
    const q = matrix ? transformPoint(matrix, p) : p
    positions[i * 3] = q[0]
    positions[i * 3 + 1] = q[1]
    positions[i * 3 + 2] = q[2]
  }
  const indices: number[] = []
  const edges: number[] = []
  const tri: number[] = []
  const valid = (face: number[], min: number) => {
    if (face.length < min) return false
    for (let k = 0; k < face.length; k++) if (!(face[k] >= 0 && face[k] < count)) return false
    return true
  }
  if (kind === "faces") {
    const flip = !(opts.ccw ?? true) !== (!!matrix && det3(matrix) < 0)
    geo.faces.forEach((face, f) => {
      if (!valid(face, 3)) return
      const ring = flip ? face.slice().reverse() : face
      const tri0 = indices.length / 3
      const n = ring.length
      for (let k = 1; k + 1 < n; k++) {
        indices.push(ring[0], ring[k], ring[k + 1])
        tri.push(f)
      }
      for (let k = 0; k < n; k++) edges.push(ring[k], ring[(k + 1) % n], tri0 + Math.min(Math.max(k - 1, 0), n - 3))
    })
  } else if (kind === "lines") {
    for (const line of geo.faces) if (valid(line, 2)) for (let k = 0; k + 1 < line.length; k++) indices.push(line[k], line[k + 1])
  } else if (geo.faces.length) {
    for (const run of geo.faces) for (const i of run) if (i >= 0 && i < count) indices.push(i)
  } else {
    for (let i = 0; i < count; i++) indices.push(i)
  }
  if (!indices.length) return null
  let triColors: Uint8Array | null = null
  if (kind === "faces" && geo.colors && geo.colors.length >= geo.faces.length * 3) {
    triColors = new Uint8Array(tri.length)
    for (let t = 0; t < tri.length; t++) {
      const f = tri[t] * 3
      triColors[t] = colorIndex(world, [geo.colors[f] * 255, geo.colors[f + 1] * 255, geo.colors[f + 2] * 255])
    }
  }
  const mesh: WorldMesh = {
    positions,
    indices: Uint32Array.from(indices),
    edges: Uint32Array.from(edges),
    color: colorIndex(world, color),
    triColors,
    solid: kind === "faces" && solid,
    kind,
    node: opts.node ?? -1,
  }
  world.meshes.push(mesh)
  return mesh
}

// ---- animation ----------------------------------------------------------------------

/** Sample a track at `t` seconds into `out` (stride values). */
export function sampleTrack(track: Track, t: number, out: number[]): void {
  const n = track.key.length
  const s = track.stride
  if (!n) return
  let u = t - track.start
  if (track.duration > 0) u = track.loop ? ((u % track.duration) + track.duration) % track.duration : Math.max(0, Math.min(track.duration, u))
  else u = 0
  let i = 0
  while (i + 1 < n && track.key[i + 1] <= u) i++
  const j = Math.min(i + 1, n - 1)
  const span = track.key[j] - track.key[i]
  const f = track.kind === "step" || span <= 0 ? 0 : Math.max(0, Math.min(1, (u - track.key[i]) / span))
  if (track.kind === "slerp") {
    const a = track.value.slice(i * 4, i * 4 + 4) as Quat
    const b = track.value.slice(j * 4, j * 4 + 4) as Quat
    const q = f === 0 ? a : quatSlerp(a, b, f)
    for (let k = 0; k < 4; k++) out[k] = q[k]
    return
  }
  for (let k = 0; k < s; k++) out[k] = track.value[i * s + k] + (track.value[j * s + k] - track.value[i * s + k]) * f
}

const poses = new WeakMap<World, { t: number; mats: Mat4[] }>()

/** Every node's world matrix at `t` seconds (cached per world + time). */
export function nodeMatrices(world: World, t: number): Mat4[] {
  const hit = poses.get(world)
  if (hit && hit.t === t && hit.mats.length === world.nodes.length) return hit.mats
  const mats: Mat4[] = []
  const v3: number[] = [0, 0, 0]
  const v4: number[] = [0, 0, 0, 1]
  world.nodes.forEach((node, i) => {
    let tr = node.translation
    let rot = node.rotation
    let sc = node.scale
    if (node.tracks.translation) {
      sampleTrack(node.tracks.translation, t, v3)
      tr = [v3[0], v3[1], v3[2]]
    }
    if (node.tracks.rotation) {
      sampleTrack(node.tracks.rotation, t, v4)
      rot = [v4[0], v4[1], v4[2], v4[3]]
    }
    if (node.tracks.scale) {
      sampleTrack(node.tracks.scale, t, v3)
      sc = [v3[0], v3[1], v3[2]]
    }
    const local = mat4Multiply(node.pre, composeTransform(tr, rot, sc, node.center, node.scaleOrientation))
    mats[i] = node.parent >= 0 ? mat4Multiply(mats[node.parent], local) : local
  })
  poses.set(world, { t, mats })
  return mats
}

/** A mesh's positions in world space for the pose `mats` (its own array when static). */
export function posedPositions(mesh: WorldMesh, mats: Mat4[] | null): Float32Array {
  if (mesh.node < 0 || !mats || !mats[mesh.node]) return mesh.positions
  const m = mats[mesh.node]
  const src = mesh.positions
  if (!mesh.scratch || mesh.scratch.length !== src.length) mesh.scratch = new Float32Array(src.length)
  const out = mesh.scratch
  for (let i = 0; i < src.length; i += 3) {
    const x = src[i]
    const y = src[i + 1]
    const z = src[i + 2]
    out[i] = m[0] * x + m[4] * y + m[8] * z + m[12]
    out[i + 1] = m[1] * x + m[5] * y + m[9] * z + m[13]
    out[i + 2] = m[2] * x + m[6] * y + m[10] * z + m[14]
  }
  return out
}

/** Fit the bounding sphere (at time 0) and the cycle length after every mesh is in. */
export function finishWorld(world: World): World {
  const mats = world.nodes.length ? nodeMatrices(world, 0) : null
  let minX = Infinity
  let minY = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let maxZ = -Infinity
  for (const m of world.meshes) {
    const p = posedPositions(m, mats)
    for (let i = 0; i < p.length; i += 3) {
      const x = p[i]
      const y = p[i + 1]
      const z = p[i + 2]
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      if (z < minZ) minZ = z
      if (z > maxZ) maxZ = z
    }
  }
  let duration = 0
  for (const n of world.nodes)
    for (const tr of Object.values(n.tracks)) if (tr) duration = Math.max(duration, tr.start + tr.duration)
  world.duration = duration
  if (minX === Infinity) {
    world.center = [0, 0, 0]
    world.radius = 1
    return world
  }
  const c: Vec3 = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2]
  let r2 = 0
  for (const m of world.meshes) {
    const p = posedPositions(m, mats)
    for (let i = 0; i < p.length; i += 3) {
      const dx = p[i] - c[0]
      const dy = p[i + 1] - c[1]
      const dz = p[i + 2] - c[2]
      const d = dx * dx + dy * dy + dz * dz
      if (d > r2) r2 = d
    }
  }
  world.center = c
  world.radius = Math.sqrt(r2) || 1
  return world
}

// ---- the camera ------------------------------------------------------------------------

/** Orbit camera: degrees, `zoom` 1 frames the bounding sphere, `time` in
 * seconds poses the file's animations. */
export type WorldView = { yaw: number; pitch: number; zoom: number; fov: number; time?: number }

export type Camera = {
  cols: number
  rows: number
  dist: number
  near: number
  /** Depth range of the sphere (2 · radius) — fog and wire bias scale by it. */
  span: number
  scale: number
  cy: number
  sy: number
  cp: number
  sp: number
  /** Camera-space lights pointing toward the light: x, y, z, intensity. */
  lights: number[]
}

/** The headlight: from the camera's upper left, unit length. */
const HEADLIGHT = [-0.36, 0.48, 0.8]

export function cameraOf(world: World, view: WorldView, cols: number, rows: number): Camera {
  const fovV = (Math.min(150, Math.max(5, view.fov)) * Math.PI) / 180
  const halfMin = Math.min(fovV / 2, Math.atan(Math.tan(fovV / 2) * (cols / rows)))
  const radius = world.radius || 1
  const zoom = view.zoom > 0 ? view.zoom : 1
  const dist = Math.max(radius * 1.02, ((radius / Math.sin(halfMin)) * 1.08) / zoom)
  const yaw = (view.yaw * Math.PI) / 180
  const pitch = (view.pitch * Math.PI) / 180
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  const lights: number[] = world.headlight ? [...HEADLIGHT, 1] : []
  for (const l of world.lights) {
    const dx = -l.direction[0]
    const dy = -l.direction[1]
    const dz = -l.direction[2]
    const x1 = dx * cy + dz * sy
    const z1 = -dx * sy + dz * cy
    lights.push(x1, dy * cp - z1 * sp, dy * sp + z1 * cp, l.intensity)
  }
  return { cols, rows, dist, near: dist - radius, span: Math.max(1e-6, 2 * radius), scale: rows / 2 / Math.tan(fovV / 2), cy, sy, cp, sp, lights }
}

let cam = new Float32Array(0)
let scr = new Float32Array(0)

/** Camera-space positions (`cam`) and screen x, y, depth (`scr`) for `positions`. */
function project(c: Camera, world: World, positions: Float32Array): void {
  const vc = positions.length / 3
  if (cam.length < vc * 3) {
    cam = new Float32Array(vc * 3)
    scr = new Float32Array(vc * 3)
  }
  const [cx0, cy0, cz0] = world.center
  for (let i = 0; i < vc; i++) {
    const px = positions[i * 3] - cx0
    const py = positions[i * 3 + 1] - cy0
    const pz = positions[i * 3 + 2] - cz0
    const x1 = px * c.cy + pz * c.sy
    const z1 = -px * c.sy + pz * c.cy
    const y2 = py * c.cp - z1 * c.sp
    const z2 = py * c.sp + z1 * c.cp - c.dist
    cam[i * 3] = x1
    cam[i * 3 + 1] = y2
    cam[i * 3 + 2] = z2
    const depth = -z2
    const inv = c.scale / Math.max(depth, 1e-6)
    scr[i * 3] = c.cols / 2 + x1 * inv
    scr[i * 3 + 1] = c.rows / 2 - y2 * inv
    scr[i * 3 + 2] = depth
  }
}

/** Flat shade of a camera-space triangle under the camera's lights. */
export function shadeOf(lights: number[], nx: number, ny: number, nz: number): number {
  let lit = 0
  for (let k = 0; k < lights.length; k += 4) {
    const d = nx * lights[k] + ny * lights[k + 1] + nz * lights[k + 2]
    if (d > 0) lit += d * lights[k + 3]
  }
  return Math.min(1, 0.15 + 0.85 * lit)
}

// ---- stage one: the target --------------------------------------------------------------

/** What a rasterizer produces per cell: lighting shade (0-1), depth from the
 * eye, and the palette index + 1 (0 = nothing drawn). */
export type WorldTarget = { width: number; height: number; shade: Float32Array; depth: Float32Array; index: Uint8Array }

export function createWorldTarget(width: number, height: number): WorldTarget {
  const n = Math.max(0, width * height)
  return { width, height, shade: new Float32Array(n), depth: new Float32Array(n), index: new Uint8Array(n) }
}

export function clearWorldTarget(t: WorldTarget): void {
  t.depth.fill(Infinity)
  t.index.fill(0)
  t.shade.fill(0)
}

export type WorldStyle = {
  /** Pixel colour (ignored per mesh when `material` is on, or when `ramp` is set). */
  fill: Rgb
  /** 4x4 Bayer thresholds (seeded or default). */
  matrix: number[][]
  /** Alpha (0-1) of the unlit dither cells inside the silhouette (fill mode). */
  shade: number
  /** Use the file's own colours (materials, face and vertex colours). */
  material: boolean
  /** Draw polygon outlines (hidden-line removed by the z-buffer). */
  wire: boolean
  /** Depth fade of the lighting, 0-1 — far parts dither sparser. */
  fog: number
  /** Toon ramp, dark to light: lighting picks the band, the Bayer cell
   * dithers between bands; the silhouette is opaque. */
  ramp?: Rgb[] | null
  /** 0 smooth ramp → 1 fully banded (ramp mode). */
  dither?: number
  /** Noise grain strength 0-1 — fbm over the model's own space modulates the shade. */
  grain?: number
  /** Grain frequency relative to the bounding sphere. */
  grainScale?: number
  /** Seed of the grain pattern. */
  seed?: number
}

/** Per-vertex fbm grain for a mesh, cached by seed + scale. */
export function meshGrain(mesh: WorldMesh, world: World, seed: number, scale: number): Float32Array {
  const key = `${seed}:${scale}`
  if (mesh.grain && mesh.grainKey === key) return mesh.grain
  const n = mesh.positions.length / 3
  const out = new Float32Array(n)
  const k = scale / (world.radius || 1)
  const ox = (Math.round(seed) % 977) * 1.618
  const oy = (Math.round(seed) % 613) * 2.718
  const p = mesh.positions
  for (let i = 0; i < n; i++) out[i] = fbm(p[i * 3] * k + ox, p[i * 3 + 1] * k + oy, p[i * 3 + 2] * k)
  mesh.grain = out
  mesh.grainKey = key
  return out
}

/**
 * The CPU engine: z-buffered flat Lambert from the headlight and the file's
 * lights, back faces culled on solid meshes, two-sided elsewhere, the shade
 * modulated by the grain. Lines and points are not rasterized here — the
 * shared pass draws them over the finished depth.
 */
export function rasterizeWorld(world: World, view: WorldView, target: WorldTarget, style: WorldStyle): void {
  clearWorldTarget(target)
  if (!world.meshes.length || target.width < 1 || target.height < 1) return
  const cols = target.width
  const rows = target.height
  const c = cameraOf(world, view, cols, rows)
  const mats = world.nodes.length ? nodeMatrices(world, view.time ?? 0) : null
  const grainAmt = clamp01(style.grain ?? 0)
  const { shade, depth: zbuf, index } = target

  for (const mesh of world.meshes) {
    if (mesh.kind !== "faces") continue
    project(c, world, posedPositions(mesh, mats))
    const grain = grainAmt > 0 ? meshGrain(mesh, world, style.seed ?? 0, style.grainScale ?? 4) : null
    const tc = mesh.indices.length / 3
    for (let t = 0; t < tc; t++) {
      const va = mesh.indices[t * 3]
      const vb = mesh.indices[t * 3 + 1]
      const vcx = mesh.indices[t * 3 + 2]
      const ia = va * 3
      const ib = vb * 3
      const ic = vcx * 3
      const ax = cam[ia]
      const ay = cam[ia + 1]
      const az = cam[ia + 2]
      const ux = cam[ib] - ax
      const uy = cam[ib + 1] - ay
      const uz = cam[ib + 2] - az
      const vx = cam[ic] - ax
      const vy = cam[ic + 1] - ay
      const vz = cam[ic + 2] - az
      let nx = uy * vz - uz * vy
      let ny = uz * vx - ux * vz
      let nz = ux * vy - uy * vx
      const facing = nx * ax + ny * ay + nz * az < 0
      if (!facing) {
        if (mesh.solid) continue
        nx = -nx
        ny = -ny
        nz = -nz
      }
      const nl = Math.hypot(nx, ny, nz)
      if (!nl) continue
      const lit = shadeOf(c.lights, nx / nl, ny / nl, nz / nl)
      const color = (mesh.triColors ? mesh.triColors[t] : mesh.color) + 1

      const sax = scr[ia]
      const say = scr[ia + 1]
      const sad = scr[ia + 2]
      const sbx = scr[ib]
      const sby = scr[ib + 1]
      const sbd = scr[ib + 2]
      const scx = scr[ic]
      const scy = scr[ic + 1]
      const scd = scr[ic + 2]
      if (sad <= 0 || sbd <= 0 || scd <= 0) continue
      const area = (sbx - sax) * (scy - say) - (sby - say) * (scx - sax)
      if (Math.abs(area) < 1e-9) continue
      const minX = Math.max(0, Math.floor(Math.min(sax, sbx, scx)))
      const maxX = Math.min(cols - 1, Math.ceil(Math.max(sax, sbx, scx)))
      const minY = Math.max(0, Math.floor(Math.min(say, sby, scy)))
      const maxY = Math.min(rows - 1, Math.ceil(Math.max(say, sby, scy)))
      if (minX > maxX || minY > maxY) continue
      const invA = 1 / area
      // Edge functions as A*x + B*y + C, normalized to barycentric weights.
      const a0 = (sby - scy) * invA
      const b0 = (scx - sbx) * invA
      const c0 = -(a0 * sbx + b0 * sby)
      const a1 = (scy - say) * invA
      const b1 = (sax - scx) * invA
      const c1 = -(a1 * scx + b1 * scy)
      const a2 = (say - sby) * invA
      const b2 = (sbx - sax) * invA
      const c2 = -(a2 * sax + b2 * say)
      const ga = grain ? grain[va] : 0
      const gb = grain ? grain[vb] : 0
      const gc = grain ? grain[vcx] : 0
      for (let y = minY; y <= maxY; y++) {
        const py = y + 0.5
        let w0 = a0 * (minX + 0.5) + b0 * py + c0
        let w1 = a1 * (minX + 0.5) + b1 * py + c1
        let w2 = a2 * (minX + 0.5) + b2 * py + c2
        for (let x = minX; x <= maxX; x++, w0 += a0, w1 += a1, w2 += a2) {
          if (w0 < 0 || w1 < 0 || w2 < 0) continue
          const d = w0 * sad + w1 * sbd + w2 * scd
          const i = y * cols + x
          if (d >= zbuf[i]) continue
          zbuf[i] = d
          index[i] = color
          shade[i] = grain ? lit * (1 - grainAmt * (1 - (w0 * ga + w1 * gb + w2 * gc))) : lit
        }
      }
    }
  }
}

// ---- stage two: dither, outlines, lines, points ----------------------------------------------

let t0 = 0
let t1 = 1

/** Liang-Barsky step: keep t where p * t <= q. */
function clipAxis(p: number, q: number): boolean {
  if (p === 0) return q >= 0
  const r = q / p
  if (p < 0) {
    if (r > t1) return false
    if (r > t0) t0 = r
  } else {
    if (r < t0) return false
    if (r < t1) t1 = r
  }
  return true
}

/** A depth-tested screen-space segment in one colour. */
function segment(buffer: RasterBuffer, target: WorldTarget, bias: number, ax: number, ay: number, ad: number, bx: number, by: number, bd: number, r: number, g: number, b: number): void {
  const cols = target.width
  const rows = target.height
  const dx = bx - ax
  const dy = by - ay
  const dd = bd - ad
  if (ad <= 0 || bd <= 0) return
  t0 = 0
  t1 = 1
  if (!clipAxis(-dx, ax) || !clipAxis(dx, cols - ax) || !clipAxis(-dy, ay) || !clipAxis(dy, rows - ay)) return
  const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * (t1 - t0))
  const data = buffer.data
  for (let s = 0; s <= steps; s++) {
    const t = t0 + ((t1 - t0) * s) / (steps || 1)
    const x = Math.floor(ax + dx * t)
    const y = Math.floor(ay + dy * t)
    if (x < 0 || y < 0 || x >= cols || y >= rows) continue
    const i = y * cols + x
    if (ad + dd * t > target.depth[i] + bias) continue
    const o = i * 4
    data[o] = r
    data[o + 1] = g
    data[o + 2] = b
    data[o + 3] = 255
  }
}

/**
 * The shared pass: every covered cell becomes a dithered pixel — fill mode
 * thresholds the shade against the Bayer cell (lit cells take the fill at
 * full alpha, the rest `shade` alpha so the silhouette reads), material mode
 * does the same in the file's colour, ramp mode picks a band of the palette
 * ramp by lighting and dithers between bands over an opaque silhouette. Then
 * outlines (`wire`), line sets and point sets are drawn depth-tested against
 * the target.
 */
export function paintTarget(buffer: RasterBuffer, target: WorldTarget, world: World, view: WorldView, style: WorldStyle): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  data.fill(0)
  if (target.width !== cols || target.height !== rows || !world.meshes.length) return
  const c = cameraOf(world, view, cols, rows)
  const fog = clamp01(style.fog)
  const shadeA = Math.round(clamp01(style.shade) * 255)
  const mat = style.matrix
  const ramp = !style.material && style.ramp && style.ramp.length >= 2 ? style.ramp : null
  const amount = clamp01(style.dither ?? 1)
  const bands = ramp ? ramp.length : 0
  const smooth: [number, number, number] = [0, 0, 0]
  const [fr, fg, fb] = style.fill
  for (let y = 0; y < rows; y++) {
    const row = mat[y & 3]
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x
      const idx = target.index[i]
      if (!idx) continue
      const th = row[x & 3]
      let v = target.shade[i]
      if (fog > 0) v *= 1 - fog * clamp01((target.depth[i] - c.near) / c.span)
      const o = i * 4
      if (ramp) {
        const band = Math.min(bands - 1, Math.floor(v * (bands - 1) + th))
        const col = ramp[band]
        if (amount < 1) {
          sampleRgbGradient(ramp, v, smooth)
          data[o] = Math.round(smooth[0] * (1 - amount) + col[0] * amount)
          data[o + 1] = Math.round(smooth[1] * (1 - amount) + col[1] * amount)
          data[o + 2] = Math.round(smooth[2] * (1 - amount) + col[2] * amount)
        } else {
          data[o] = col[0]
          data[o + 1] = col[1]
          data[o + 2] = col[2]
        }
        data[o + 3] = 255
        continue
      }
      const col = style.material ? world.palette[idx - 1] : null
      data[o] = col ? col[0] : fr
      data[o + 1] = col ? col[1] : fg
      data[o + 2] = col ? col[2] : fb
      data[o + 3] = v > th ? 255 : shadeA
    }
  }

  drawOverlays(buffer, target, world, view, style)
}

/** Outlines (`wire`), line sets and point sets over the finished depth. */
export function drawOverlays(buffer: RasterBuffer, target: WorldTarget, world: World, view: WorldView, style: WorldStyle): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const c = cameraOf(world, view, cols, rows)
  const ramp = !style.material && style.ramp && style.ramp.length >= 2 ? style.ramp : null
  const mats = world.nodes.length ? nodeMatrices(world, view.time ?? 0) : null
  const bias = c.span * 0.02
  const top = ramp ? ramp[ramp.length - 1] : null
  for (const mesh of world.meshes) {
    const faces = mesh.kind === "faces"
    if (faces && !style.wire) continue
    const mc = style.material ? world.palette[mesh.color] : top ? top : style.fill
    const [r, g, b] = mc
    project(c, world, posedPositions(mesh, mats))
    if (faces) {
      for (let e = 0; e < mesh.edges.length; e += 3) {
        if (mesh.solid) {
          const t = mesh.edges[e + 2] * 3
          const ia = mesh.indices[t] * 3
          const ib = mesh.indices[t + 1] * 3
          const ic = mesh.indices[t + 2] * 3
          const ux = cam[ib] - cam[ia]
          const uy = cam[ib + 1] - cam[ia + 1]
          const uz = cam[ib + 2] - cam[ia + 2]
          const vx = cam[ic] - cam[ia]
          const vy = cam[ic + 1] - cam[ia + 1]
          const vz = cam[ic + 2] - cam[ia + 2]
          const nx = uy * vz - uz * vy
          const ny = uz * vx - ux * vz
          const nz = ux * vy - uy * vx
          if (nx * cam[ia] + ny * cam[ia + 1] + nz * cam[ia + 2] >= 0) continue
        }
        const ia = mesh.edges[e] * 3
        const ib = mesh.edges[e + 1] * 3
        segment(buffer, target, bias, scr[ia], scr[ia + 1], scr[ia + 2], scr[ib], scr[ib + 1], scr[ib + 2], r, g, b)
      }
    } else if (mesh.kind === "lines") {
      for (let e = 0; e + 1 < mesh.indices.length; e += 2) {
        const ia = mesh.indices[e] * 3
        const ib = mesh.indices[e + 1] * 3
        segment(buffer, target, bias, scr[ia], scr[ia + 1], scr[ia + 2], scr[ib], scr[ib + 1], scr[ib + 2], r, g, b)
      }
    } else {
      for (let k = 0; k < mesh.indices.length; k++) {
        const ia = mesh.indices[k] * 3
        const d = scr[ia + 2]
        if (d <= 0) continue
        const x = Math.floor(scr[ia])
        const y = Math.floor(scr[ia + 1])
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue
        const i = y * cols + x
        if (d > target.depth[i] + bias) continue
        const o = i * 4
        data[o] = r
        data[o + 1] = g
        data[o + 2] = b
        data[o + 3] = 255
      }
    }
  }
}

/**
 * Stage two with a material: `rgba` is a GLSL material's output over the
 * target (rows bottom-up, as read back from the GPU) — its alpha is the
 * shade the Bayer cell thresholds, its rgb the colour; cells it leaves at
 * zero stay clear, so a material may also paint outside the silhouette
 * (an ink halo from depth edges). The overlays follow as usual.
 */
export function paintMaterial(buffer: RasterBuffer, target: WorldTarget, world: World, view: WorldView, style: WorldStyle, rgba: Uint8Array): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  data.fill(0)
  if (target.width !== cols || target.height !== rows || rgba.length < cols * rows * 4) return
  const shadeA = Math.round(clamp01(style.shade) * 255)
  const mat = style.matrix
  for (let y = 0; y < rows; y++) {
    const row = mat[y & 3]
    const src = (rows - 1 - y) * cols
    for (let x = 0; x < cols; x++) {
      const s = (src + x) * 4
      const a = rgba[s + 3]
      if (!a) continue
      const o = (y * cols + x) * 4
      data[o] = rgba[s]
      data[o + 1] = rgba[s + 1]
      data[o + 2] = rgba[s + 2]
      data[o + 3] = a / 255 > row[x & 3] ? 255 : shadeA
    }
  }
  drawOverlays(buffer, target, world, view, style)
}

/** Pack a target for the GPU: R shade, G palette index + 1, B + A a 16-bit
 * depth across the bounding sphere (empty cells read as far). */
export function packTarget(target: WorldTarget, world: World, view: WorldView, out?: Uint8Array): Uint8Array {
  const n = target.width * target.height
  const px = out && out.length === n * 4 ? out : new Uint8Array(n * 4)
  const c = cameraOf(world, view, Math.max(1, target.width), Math.max(1, target.height))
  for (let i = 0; i < n; i++) {
    const idx = target.index[i]
    const o = i * 4
    px[o] = idx ? Math.round(clamp01(target.shade[i]) * 255) : 0
    px[o + 1] = idx
    const code = idx ? Math.round(clamp01((target.depth[i] - c.near) / c.span) * 65535) : 65535
    px[o + 2] = code >> 8
    px[o + 3] = code & 255
  }
  return px
}

let cpuTarget: WorldTarget | null = null

/** One frame on the CPU engine: rasterize, then the shared pass. */
export function paintWorld(buffer: RasterBuffer, world: World, view: WorldView, style: WorldStyle): void {
  if (!cpuTarget || cpuTarget.width !== buffer.width || cpuTarget.height !== buffer.height) cpuTarget = createWorldTarget(buffer.width, buffer.height)
  rasterizeWorld(world, view, cpuTarget, style)
  paintTarget(buffer, cpuTarget, world, view, style)
}

// ---- the default content -------------------------------------------------------------------

/** VRML97 text for a seeded probe: a body, a tilted ring, arms with tips
 * that the file itself revolves and an antenna it bobs (TimeSensor →
 * interpolators → ROUTEs) — a point in a form space, not a preset, written
 * as a real .wrl so the default content exercises the parser, the palette
 * and the clock. */
export function sampleWorld(seed = 0): string {
  const rand = xorshift32(Math.round(seed) || 0x2545f491)
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]
  const n = (v: number) => String(Math.round(v * 1000) / 1000)
  const tone = (h: number, s: number, v: number) =>
    hsvToRgb(((h % 360) + 360) % 360, s, v)
      .map((c) => n(c / 255))
      .join(" ")
  const hue = rand() * 360
  const body = pick(["sphere", "box", "cylinder"])
  const arms = 2 + Math.floor(rand() * 4)
  const reach = 1.3 + rand() * 1.1
  const tilt = (rand() - 0.5) * 1.3
  const ringR = 1.4 + rand() * 0.8
  const tip = pick(["cone", "sphere", "box"])
  const cycle = 4 + Math.round(rand() * 6)
  const segments = 24
  const ring: string[] = []
  const faces: string[] = []
  for (let j = 0; j < segments; j++) {
    const th = (2 * Math.PI * j) / segments
    ring.push(`${n(ringR * Math.cos(th))} 0 ${n(ringR * Math.sin(th))}`, `${n((ringR - 0.22) * Math.cos(th))} 0 ${n((ringR - 0.22) * Math.sin(th))}`)
    const k = (j + 1) % segments
    faces.push(`${j * 2} ${k * 2} ${k * 2 + 1} ${j * 2 + 1} -1`)
  }
  const shape = (geometry: string, color: string) =>
    `Shape { appearance Appearance { material Material { diffuseColor ${color} } } geometry ${geometry} }`
  const bodyGeometry = body === "sphere" ? "Sphere { radius 1 }" : body === "box" ? "Box { size 1.6 1.6 1.6 }" : "Cylinder { radius 0.9 height 1.4 }"
  const tipGeometry = tip === "cone" ? "Cone { bottomRadius 0.22 height 0.5 }" : tip === "sphere" ? "Sphere { radius 0.24 }" : "Box { size 0.36 0.36 0.36 }"
  const ringShape = shape(`IndexedFaceSet { solid FALSE coord Coordinate { point [ ${ring.join(", ")} ] } coordIndex [ ${faces.join(" ")} ] }`, tone(hue + 40, 0.4, 0.8))
  const top = body === "box" ? 1.1 : 1.2
  const lines = [
    "#VRML V2.0 utf8",
    `# dither-kit sample world, seed ${Math.round(seed)}`,
    `DEF Body Transform { children ${shape(bodyGeometry, tone(hue, 0.55, 0.95))} }`,
    `Transform { rotation 1 0 0 ${n(tilt)} children ${ringShape} }`,
    `DEF Arm Group { children [`,
    `  Transform { translation ${n(reach / 2)} 0 0 rotation 0 0 1 -1.5708 children ${shape(`Cylinder { radius 0.07 height ${n(reach)} }`, tone(hue + 180, 0.3, 0.7))} }`,
    `  Transform { translation ${n(reach)} 0 0 rotation 0 0 1 -1.5708 children ${shape(tipGeometry, tone(hue + 200, 0.6, 0.9))} }`,
    `] }`,
    `DEF Arms Transform { children [ USE Arm`,
  ]
  for (let a = 1; a < arms; a++) lines.push(`  Transform { rotation 0 1 0 ${n((2 * Math.PI * a) / arms)} children USE Arm }`)
  lines.push(
    `] }`,
    `DEF Antenna Transform { translation 0 ${n(top)} 0 children ${shape("Cone { bottomRadius 0.18 height 0.5 }", tone(hue + 20, 0.5, 1))} }`,
    `DEF Clock TimeSensor { cycleInterval ${cycle} loop TRUE }`,
    `DEF Spin OrientationInterpolator { key [ 0 0.5 1 ] keyValue [ 0 1 0 0, 0 1 0 3.14159, 0 1 0 6.28318 ] }`,
    `DEF Bob PositionInterpolator { key [ 0 0.5 1 ] keyValue [ 0 ${n(top)} 0, 0 ${n(top + 0.3)} 0, 0 ${n(top)} 0 ] }`,
    `ROUTE Clock.fraction_changed TO Spin.set_fraction`,
    `ROUTE Spin.value_changed TO Arms.set_rotation`,
    `ROUTE Clock.fraction_changed TO Bob.set_fraction`,
    `ROUTE Bob.value_changed TO Antenna.set_translation`,
  )
  return lines.join("\n") + "\n"
}
