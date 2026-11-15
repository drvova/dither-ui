// The 3D surface's scene (`world.ts`): a `World` of meshes under animatable
// nodes, its palette, lights and first viewpoint. `addMesh` bakes raw
// geometry into it, `sampleTrack` and `nodeMatrices` pose its animation at a
// time, `finishWorld` fits its bounding sphere and cycle. What the parsers
// (`models/`) build and the renderer draws.

import {
  composeTransform,
  det3,
  mat4Identity,
  mat4Multiply,
  QUAT_IDENTITY,
  quatSlerp,
  transformPoint,
  type Mat4,
  type Quat,
  type Vec3,
} from "./world-math"
import type { Geometry } from "./world-shapes"
import type { Rgb } from "./palette"
import { cloudBounds, type SplatCloud } from "./splats"

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
  /** Texture coordinates per vertex (st, top-left origin) when the file or primitive has them. */
  uv: Float32Array | null
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
  /** The palette entries that give off light (an emissive material's
   * colour): painted in their own colour, lit whatever the mode. A glowing
   * entry is never shared with a plain one of the same colour. */
  glows: number[]
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
  /** A capture's Gaussians (`splats.ts`), composited over the meshes; null for none. */
  splats: SplatCloud | null
}

export function emptyWorld(): World {
  return {
    meshes: [],
    nodes: [],
    palette: [],
    glows: [],
    lights: [],
    headlight: true,
    viewpoint: null,
    center: [0, 0, 0],
    radius: 1,
    duration: 0,
    splats: null,
  }
}

/** Palette index for a colour — at most 255 distinct colours per world, the
 * rest snap to their nearest neighbour. A glowing colour (`glow`) takes an
 * entry of its own, marked in `glows`, never a plain one's. */
export function colorIndex(world: World, rgb: Rgb, glow = false): number {
  const r = Math.max(0, Math.min(255, Math.round(rgb[0])))
  const g = Math.max(0, Math.min(255, Math.round(rgb[1])))
  const b = Math.max(0, Math.min(255, Math.round(rgb[2])))
  const p = world.palette
  let best = -1
  let bestD = Infinity
  for (let i = 0; i < p.length; i++) {
    if (world.glows.includes(i) !== glow) continue
    const d = (p[i][0] - r) ** 2 + (p[i][1] - g) ** 2 + (p[i][2] - b) ** 2
    if (d === 0) return i
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  if (p.length >= 255 && best >= 0) return best
  p.push([r, g, b])
  if (glow) world.glows.push(p.length - 1)
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

/** `glow`: the mesh's material gives off light (its colour a `glows` entry). */
export type MeshOptions = { kind?: MeshKind; node?: number; ccw?: boolean; glow?: boolean }

/**
 * Bake geometry into a mesh: transform, enforce outward winding (`ccw` false
 * or a mirroring matrix reverses every ring), fan-triangulate polygons, keep
 * the outlines for the wire pass, register colours in the palette. Lines
 * take rings as polylines, points take them as runs (or every point).
 */
export function addMesh(
  world: World,
  geo: Geometry,
  matrix: Mat4 | null,
  color: Rgb,
  solid: boolean,
  opts: MeshOptions = {},
): WorldMesh | null {
  const count = Math.floor(geo.points.length / 3)
  if (!count) return null
  const kind = opts.kind ?? "faces"
  let positions = new Float32Array(count * 3)
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
  let uv: Float32Array | null = null
  const valid = (face: number[], min: number) => {
    if (face.length < min) return false
    for (let k = 0; k < face.length; k++) if (!(face[k] >= 0 && face[k] < count)) return false
    return true
  }
  if (kind === "faces") {
    const flip = !(opts.ccw ?? true) !== (!!matrix && det3(matrix) < 0)
    // Texture seams: with per-corner uvs a point becomes one vertex per uv it is used with.
    const uvs = geo.uvs
    const corners = uvs && geo.faceUvs ? geo.faceUvs : null
    const uvCount = uvs ? Math.floor(uvs.length / 2) : 0
    const xyz: number[] = []
    const st: number[] = []
    const seen = new Map<number, number>()
    const vertex = (p: number, u: number) => {
      const key = p * (uvCount + 1) + (u + 1)
      let v = seen.get(key)
      if (v === undefined) {
        v = xyz.length / 3
        seen.set(key, v)
        xyz.push(positions[p * 3], positions[p * 3 + 1], positions[p * 3 + 2])
        const known = uvs && u >= 0 && u < uvCount
        st.push(known ? uvs[u * 2] : 0, known ? uvs[u * 2 + 1] : 0)
      }
      return v
    }
    geo.faces.forEach((face, f) => {
      if (!valid(face, 3)) return
      const mapped = corners ? face.map((p, k) => vertex(p, corners[f]?.[k] ?? -1)) : face
      const ring = flip ? mapped.slice().reverse() : mapped
      const tri0 = indices.length / 3
      const n = ring.length
      for (let k = 1; k + 1 < n; k++) {
        indices.push(ring[0], ring[k], ring[k + 1])
        tri.push(f)
      }
      for (let k = 0; k < n; k++) edges.push(ring[k], ring[(k + 1) % n], tri0 + Math.min(Math.max(k - 1, 0), n - 3))
    })
    if (corners) {
      positions = Float32Array.from(xyz)
      uv = Float32Array.from(st)
    } else if (uvs) {
      uv = new Float32Array(count * 2)
      for (let i = 0; i < count; i++) {
        uv[i * 2] = uvs[i * 2] ?? 0
        uv[i * 2 + 1] = uvs[i * 2 + 1] ?? 0
      }
    }
  } else if (kind === "lines") {
    for (const line of geo.faces)
      if (valid(line, 2)) for (let k = 0; k + 1 < line.length; k++) indices.push(line[k], line[k + 1])
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
    color: colorIndex(world, color, opts.glow),
    triColors,
    uv,
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
  if (track.duration > 0)
    u = track.loop ? ((u % track.duration) + track.duration) % track.duration : Math.max(0, Math.min(track.duration, u))
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
  const cloud = world.splats ? cloudBounds(world.splats) : null
  if (cloud) {
    minX = Math.min(minX, cloud.min[0])
    minY = Math.min(minY, cloud.min[1])
    minZ = Math.min(minZ, cloud.min[2])
    maxX = Math.max(maxX, cloud.max[0])
    maxY = Math.max(maxY, cloud.max[1])
    maxZ = Math.max(maxZ, cloud.max[2])
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
  // a capture's reach is its box without stray splats, never its farthest one
  if (cloud) r2 = Math.max(r2, ((maxX - minX) ** 2 + (maxY - minY) ** 2 + (maxZ - minZ) ** 2) / 4)
  world.center = c
  world.radius = Math.sqrt(r2) || 1
  return world
}
