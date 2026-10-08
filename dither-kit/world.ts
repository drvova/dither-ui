// 3D for the dither engine: a scene of triangle meshes, an orbit camera and a
// z-buffered flat-shaded rasterizer that writes 1-bit ordered-dithered pixels
// into a RasterBuffer. DOM-free and WebGL-free on purpose — the same bytes come
// out in a browser, a worker, a Node test and a HyperFrames capture, GPU or
// not. Model files (.wrl / .obj / .stl) are parsed by
// `models.ts` into the World shape below; `sampleWorld` writes the seeded
// default content as VRML97 text so the default goes through the same parser.

import { clamp01, xorshift32 } from "./pixel"
import { hsvToRgb, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type Vec3 = [number, number, number]
/** Column-major 4x4 acting on column vectors (p' = M p). */
export type Mat4 = number[]

/** Raw polygons before baking: flat xyz triples + index rings. */
export type Geometry = { points: number[]; faces: number[][] }

export type WorldMesh = {
  /** World-space xyz triples. */
  positions: Float32Array
  /** Triangle vertex indices (polygons fan-triangulated). */
  indices: Uint32Array
  /** Polygon outline edges as (a, b, owning triangle) triples — `wire` draws
   * these, never a fan's diagonals. */
  edges: Uint32Array
  /** Material diffuse colour, 0-255. */
  color: Rgb
  /** Back faces are culled (the file promised outward winding). */
  solid: boolean
}

/** A directional light, world space, the direction the light TRAVELS (VRML). */
export type WorldLight = { direction: Vec3; intensity: number }

export type World = {
  meshes: WorldMesh[]
  lights: WorldLight[]
  /** VRML `NavigationInfo { headlight }`: a light riding the camera. */
  headlight: boolean
  /** The file's first viewpoint: where it stood, vertical field of view in degrees. */
  viewpoint: { position: Vec3; fov: number } | null
  /** Bounding sphere — the orbit camera's target and framing. */
  center: Vec3
  radius: number
}

// ---- vectors + matrices ------------------------------------------------------

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
export function mat4Rotate([ax, ay, az]: Vec3, angle: number): Mat4 {
  const len = Math.hypot(ax, ay, az)
  if (!len || !angle) return mat4Identity()
  const x = ax / len
  const y = ay / len
  const z = az / len
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const t = 1 - c
  return [
    t * x * x + c, t * x * y + s * z, t * x * z - s * y, 0,
    t * x * y - s * z, t * y * y + c, t * y * z + s * x, 0,
    t * x * z + s * y, t * y * z - s * x, t * z * z + c, 0,
    0, 0, 0, 1,
  ]
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

// ---- primitives (VRML conventions: y up, centred on the origin) --------------

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

// ---- meshes + worlds ---------------------------------------------------------

/** Bake polygons into a world-space mesh: transform, enforce outward winding
 * (`ccw` false or a mirroring matrix reverses every ring), fan-triangulate,
 * and keep the polygon outlines for the wire pass. */
export function meshFrom(geo: Geometry, matrix: Mat4 | null, color: Rgb, solid: boolean, ccw = true): WorldMesh | null {
  const count = Math.floor(geo.points.length / 3)
  if (!count) return null
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const p: Vec3 = [geo.points[i * 3], geo.points[i * 3 + 1], geo.points[i * 3 + 2]]
    const q = matrix ? transformPoint(matrix, p) : p
    positions[i * 3] = q[0]
    positions[i * 3 + 1] = q[1]
    positions[i * 3 + 2] = q[2]
  }
  const flip = !ccw !== (!!matrix && det3(matrix) < 0)
  const indices: number[] = []
  const edges: number[] = []
  for (const face of geo.faces) {
    let ok = face.length >= 3
    for (let k = 0; ok && k < face.length; k++) ok = face[k] >= 0 && face[k] < count
    if (!ok) continue
    const ring = flip ? face.slice().reverse() : face
    const tri0 = indices.length / 3
    const n = ring.length
    for (let k = 1; k + 1 < n; k++) indices.push(ring[0], ring[k], ring[k + 1])
    for (let k = 0; k < n; k++) edges.push(ring[k], ring[(k + 1) % n], tri0 + Math.min(Math.max(k - 1, 0), n - 3))
  }
  if (!indices.length) return null
  return { positions, indices: Uint32Array.from(indices), edges: Uint32Array.from(edges), color, solid }
}

export function emptyWorld(): World {
  return { meshes: [], lights: [], headlight: true, viewpoint: null, center: [0, 0, 0], radius: 1 }
}

/** Fit the bounding sphere after every mesh is in. */
export function finishWorld(world: World): World {
  let minX = Infinity
  let minY = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let maxZ = -Infinity
  for (const m of world.meshes)
    for (let i = 0; i < m.positions.length; i += 3) {
      const x = m.positions[i]
      const y = m.positions[i + 1]
      const z = m.positions[i + 2]
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      if (z < minZ) minZ = z
      if (z > maxZ) maxZ = z
    }
  if (minX === Infinity) {
    world.center = [0, 0, 0]
    world.radius = 1
    return world
  }
  const c: Vec3 = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2]
  let r2 = 0
  for (const m of world.meshes)
    for (let i = 0; i < m.positions.length; i += 3) {
      const dx = m.positions[i] - c[0]
      const dy = m.positions[i + 1] - c[1]
      const dz = m.positions[i + 2] - c[2]
      const d = dx * dx + dy * dy + dz * dz
      if (d > r2) r2 = d
    }
  world.center = c
  world.radius = Math.sqrt(r2) || 1
  return world
}

// ---- the rasterizer ----------------------------------------------------------

/** Orbit camera: degrees, `zoom` 1 frames the bounding sphere. */
export type WorldView = { yaw: number; pitch: number; zoom: number; fov: number }

export type WorldStyle = {
  /** Pixel colour (ignored per mesh when `material` is on). */
  fill: Rgb
  /** 4x4 Bayer thresholds (seeded or default). */
  matrix: number[][]
  /** Alpha (0-1) of the unlit dither cells inside the silhouette. */
  shade: number
  /** Use each mesh's own material colour. */
  material: boolean
  /** Draw polygon outlines (hidden-line removed by the z-buffer). */
  wire: boolean
  /** Depth fade of the lighting, 0-1 — far parts dither sparser. */
  fog: number
}

/** The headlight: from the camera's upper left, unit length. */
const HEADLIGHT = [-0.36, 0.48, 0.8]

let zbuf = new Float32Array(0)
let cam = new Float32Array(0)
let scr = new Float32Array(0)
let front = new Uint8Array(0)
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

/**
 * Paint one frame: clears the buffer, orbits the camera around the world's
 * bounding sphere, rasterizes every front-facing (or two-sided) triangle with
 * a z-buffer and flat Lambert shading from the headlight and the file's
 * directional lights, and thresholds each pixel's shade against the Bayer
 * cell: lit cells take the fill at full alpha, the rest `shade` alpha so the
 * silhouette still reads. Same world + view + style → same bytes.
 */
export function paintWorld(buffer: RasterBuffer, world: World, view: WorldView, style: WorldStyle): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  data.fill(0)
  const n = cols * rows
  if (zbuf.length < n) zbuf = new Float32Array(n)
  zbuf.fill(Infinity, 0, n)
  if (!world.meshes.length || cols < 1 || rows < 1) return

  const fovV = (Math.min(150, Math.max(5, view.fov)) * Math.PI) / 180
  const halfMin = Math.min(fovV / 2, Math.atan(Math.tan(fovV / 2) * (cols / rows)))
  const radius = world.radius || 1
  const zoom = view.zoom > 0 ? view.zoom : 1
  const dist = Math.max(radius * 1.02, ((radius / Math.sin(halfMin)) * 1.08) / zoom)
  const near = dist - radius
  const fogSpan = Math.max(1e-6, 2 * radius)
  const yaw = (view.yaw * Math.PI) / 180
  const pitch = (view.pitch * Math.PI) / 180
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  const scale = rows / 2 / Math.tan(fovV / 2)
  const [cx0, cy0, cz0] = world.center

  // Lights in camera space, pointing toward the light: x, y, z, intensity.
  const lights: number[] = world.headlight ? [...HEADLIGHT, 1] : []
  for (const l of world.lights) {
    const dx = -l.direction[0]
    const dy = -l.direction[1]
    const dz = -l.direction[2]
    const x1 = dx * cy + dz * sy
    const z1 = -dx * sy + dz * cy
    lights.push(x1, dy * cp - z1 * sp, dy * sp + z1 * cp, l.intensity)
  }

  const shadeA = Math.round(clamp01(style.shade) * 255)
  const fog = clamp01(style.fog)
  const mat = style.matrix

  /** Camera-space positions + screen x, y, depth for one mesh. */
  const project = (mesh: WorldMesh) => {
    const vc = mesh.positions.length / 3
    if (cam.length < vc * 3) {
      cam = new Float32Array(vc * 3)
      scr = new Float32Array(vc * 3)
    }
    for (let i = 0; i < vc; i++) {
      const px = mesh.positions[i * 3] - cx0
      const py = mesh.positions[i * 3 + 1] - cy0
      const pz = mesh.positions[i * 3 + 2] - cz0
      const x1 = px * cy + pz * sy
      const z1 = -px * sy + pz * cy
      const y2 = py * cp - z1 * sp
      const z2 = py * sp + z1 * cp - dist
      cam[i * 3] = x1
      cam[i * 3 + 1] = y2
      cam[i * 3 + 2] = z2
      const depth = -z2
      const inv = scale / Math.max(depth, 1e-6)
      scr[i * 3] = cols / 2 + x1 * inv
      scr[i * 3 + 1] = rows / 2 - y2 * inv
      scr[i * 3 + 2] = depth
    }
  }

  let triBase = 0
  let total = 0
  for (const m of world.meshes) total += m.indices.length / 3
  if (front.length < total) front = new Uint8Array(total)

  for (const mesh of world.meshes) {
    project(mesh)
    const [fr, fg, fb] = style.material ? mesh.color : style.fill
    const tc = mesh.indices.length / 3
    for (let t = 0; t < tc; t++) {
      const ia = mesh.indices[t * 3] * 3
      const ib = mesh.indices[t * 3 + 1] * 3
      const ic = mesh.indices[t * 3 + 2] * 3
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
      front[triBase + t] = facing ? 1 : 0
      if (!facing) {
        if (mesh.solid) continue
        nx = -nx
        ny = -ny
        nz = -nz
      }
      const nl = Math.hypot(nx, ny, nz)
      if (!nl) continue
      nx /= nl
      ny /= nl
      nz /= nl
      let lit = 0
      for (let k = 0; k < lights.length; k += 4) {
        const d = nx * lights[k] + ny * lights[k + 1] + nz * lights[k + 2]
        if (d > 0) lit += d * lights[k + 3]
      }
      const shade = Math.min(1, 0.15 + 0.85 * lit)

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
      for (let y = minY; y <= maxY; y++) {
        const py = y + 0.5
        let w0 = a0 * (minX + 0.5) + b0 * py + c0
        let w1 = a1 * (minX + 0.5) + b1 * py + c1
        let w2 = a2 * (minX + 0.5) + b2 * py + c2
        const row = mat[y & 3]
        for (let x = minX; x <= maxX; x++, w0 += a0, w1 += a1, w2 += a2) {
          if (w0 < 0 || w1 < 0 || w2 < 0) continue
          const depth = w0 * sad + w1 * sbd + w2 * scd
          const i = y * cols + x
          if (depth >= zbuf[i]) continue
          zbuf[i] = depth
          const v = fog > 0 ? shade * (1 - fog * clamp01((depth - near) / fogSpan)) : shade
          const o = i * 4
          data[o] = fr
          data[o + 1] = fg
          data[o + 2] = fb
          data[o + 3] = v > row[x & 3] ? 255 : shadeA
        }
      }
    }
    triBase += tc
  }

  if (!style.wire) return
  const bias = fogSpan * 0.02
  triBase = 0
  for (const mesh of world.meshes) {
    project(mesh)
    const [fr, fg, fb] = style.material ? mesh.color : style.fill
    for (let e = 0; e < mesh.edges.length; e += 3) {
      if (mesh.solid && !front[triBase + mesh.edges[e + 2]]) continue
      const ia = mesh.edges[e] * 3
      const ib = mesh.edges[e + 1] * 3
      const ax = scr[ia]
      const ay = scr[ia + 1]
      const ad = scr[ia + 2]
      const dx = scr[ib] - ax
      const dy = scr[ib + 1] - ay
      const dd = scr[ib + 2] - ad
      if (ad <= 0 || ad + dd <= 0) continue
      t0 = 0
      t1 = 1
      if (!clipAxis(-dx, ax) || !clipAxis(dx, cols - ax) || !clipAxis(-dy, ay) || !clipAxis(dy, rows - ay)) continue
      const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * (t1 - t0))
      for (let s = 0; s <= steps; s++) {
        const t = t0 + ((t1 - t0) * s) / (steps || 1)
        const x = Math.floor(ax + dx * t)
        const y = Math.floor(ay + dy * t)
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue
        const i = y * cols + x
        if (ad + dd * t > zbuf[i] + bias) continue
        const o = i * 4
        data[o] = fr
        data[o + 1] = fg
        data[o + 2] = fb
        data[o + 3] = 255
      }
    }
    triBase += mesh.indices.length / 3
  }
}

// ---- the default content -----------------------------------------------------

/** VRML97 text for a seeded probe: a body, a ring, arms with tips, an
 * antenna — a point in a form space, not a preset, written as a real .wrl so
 * the default content exercises the same parser a file does. */
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
  const lines = [
    "#VRML V2.0 utf8",
    `# dither-kit sample world, seed ${Math.round(seed)}`,
    `DEF Body Transform { children ${shape(bodyGeometry, tone(hue, 0.55, 0.95))} }`,
    `Transform { rotation 1 0 0 ${n(tilt)} children ${shape(`IndexedFaceSet { solid FALSE coord Coordinate { point [ ${ring.join(", ")} ] } coordIndex [ ${faces.join(" ")} ] }`, tone(hue + 40, 0.4, 0.8))} }`,
    `DEF Arm Group { children [`,
    `  Transform { translation ${n(reach / 2)} 0 0 rotation 0 0 1 -1.5708 children ${shape(`Cylinder { radius 0.07 height ${n(reach)} }`, tone(hue + 180, 0.3, 0.7))} }`,
    `  Transform { translation ${n(reach)} 0 0 rotation 0 0 1 -1.5708 children ${shape(tipGeometry, tone(hue + 200, 0.6, 0.9))} }`,
    `] }`,
  ]
  for (let a = 1; a < arms; a++) lines.push(`Transform { rotation 0 1 0 ${n((2 * Math.PI * a) / arms)} children USE Arm }`)
  lines.push(`Transform { translation 0 ${n(body === "box" ? 1.1 : 1.2)} 0 children ${shape("Cone { bottomRadius 0.18 height 0.5 }", tone(hue + 20, 0.5, 1))} }`)
  return lines.join("\n") + "\n"
}
