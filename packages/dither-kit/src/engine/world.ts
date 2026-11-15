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
//
// The engine stands on its own files, which it hands on under the names it
// always exported: the maths (`world-math.ts`), the primitives
// (`world-shapes.ts`), the scene and its animation (`world-scene.ts`) and
// the default content (`world-sample.ts`).

import { nodeMatrices, posedPositions, type World, type WorldMesh } from "./world-scene"
import { clamp01 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import { fbm } from "./noise"
import type { RasterBuffer } from "./raster"
import { compositeSplats } from "./splats"

export * from "./world-math"
export * from "./world-shapes"
export * from "./world-scene"
export { sampleWorld } from "./world-sample"

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
  return {
    cols,
    rows,
    dist,
    near: dist - radius,
    span: Math.max(1e-6, 2 * radius),
    scale: rows / 2 / Math.tan(fovV / 2),
    cy,
    sy,
    cp,
    sp,
    lights,
  }
}

let cam = new Float32Array(0)
let scr = new Float32Array(0)

/** One world point through the camera: camera-space x, y, z into `camOut`
 * and screen x, y (cells) and depth from the eye into `scrOut`, at `o`. */
function toScreen(
  c: Camera,
  world: World,
  x: number,
  y: number,
  z: number,
  camOut: Float32Array,
  scrOut: Float32Array,
  o: number,
): void {
  const px = x - world.center[0]
  const py = y - world.center[1]
  const pz = z - world.center[2]
  const x1 = px * c.cy + pz * c.sy
  const z1 = -px * c.sy + pz * c.cy
  const y2 = py * c.cp - z1 * c.sp
  const z2 = py * c.sp + z1 * c.cp - c.dist
  camOut[o] = x1
  camOut[o + 1] = y2
  camOut[o + 2] = z2
  const depth = -z2
  const inv = c.scale / Math.max(depth, 1e-6)
  scrOut[o] = c.cols / 2 + x1 * inv
  scrOut[o + 1] = c.rows / 2 - y2 * inv
  scrOut[o + 2] = depth
}

const oneCam = new Float32Array(3)
/** Where a world point lands on the target: x, y in cells, depth from the eye. */
export function screenOf(c: Camera, world: World, x: number, y: number, z: number): [number, number, number] {
  const out = new Float32Array(3)
  toScreen(c, world, x, y, z, oneCam, out, 0)
  return [out[0], out[1], out[2]]
}

/** Camera-space positions (`cam`) and screen x, y, depth (`scr`) for `positions`. */
function project(c: Camera, world: World, positions: Float32Array): void {
  const vc = positions.length / 3
  if (cam.length < vc * 3) {
    cam = new Float32Array(vc * 3)
    scr = new Float32Array(vc * 3)
  }
  for (let i = 0; i < vc; i++)
    toScreen(c, world, positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2], cam, scr, i * 3)
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
 * eye, the palette index + 1 (0 = nothing drawn), and the texture
 * coordinates (st pairs; s = -1 where the mesh has none). */
export type WorldTarget = {
  width: number
  height: number
  shade: Float32Array
  depth: Float32Array
  index: Uint8Array
  uv: Float32Array
}

export function createWorldTarget(width: number, height: number): WorldTarget {
  const n = Math.max(0, width * height)
  return {
    width,
    height,
    shade: new Float32Array(n),
    depth: new Float32Array(n),
    index: new Uint8Array(n),
    uv: new Float32Array(n * 2),
  }
}

export function clearWorldTarget(t: WorldTarget): void {
  t.depth.fill(Infinity)
  t.index.fill(0)
  t.shade.fill(0)
  t.uv.fill(0)
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
  /** A raster wrapped onto the model through its texture coordinates: its
   * colour per cell, its alpha in the shade (meshes without uvs keep the fill). */
  texture?: RasterBuffer | null
}

/** The least shade a glowing cell (`World.glows`) paints at: it gives off
 * light, yet keeps its form. */
export const GLOW_FLOOR = 0.62

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
  if (target.width < 1 || target.height < 1) return
  rasterizeMeshes(world, view, target, style)
  layCapture(world, view, target)
}

/** A capture's Gaussians over what the meshes drew (either engine's target). */
export function layCapture(world: World, view: WorldView, target: WorldTarget): void {
  if (!world.splats) return
  const c = cameraOf(world, view, target.width, target.height)
  compositeSplats(world.splats, { ...c, center: world.center }, target)
}

function rasterizeMeshes(world: World, view: WorldView, target: WorldTarget, style: WorldStyle): void {
  if (!world.meshes.length) return
  const cols = target.width
  const rows = target.height
  const c = cameraOf(world, view, cols, rows)
  const mats = world.nodes.length ? nodeMatrices(world, view.time ?? 0) : null
  const grainAmt = clamp01(style.grain ?? 0)
  const { shade, depth: zbuf, index, uv: uvt } = target

  for (const mesh of world.meshes) {
    if (mesh.kind !== "faces") continue
    project(c, world, posedPositions(mesh, mats))
    const grain = grainAmt > 0 ? meshGrain(mesh, world, style.seed ?? 0, style.grainScale ?? 4) : null
    const muv = mesh.uv
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
      // Texture coordinates interpolate perspective-correct: weights over depth.
      const iwa = 1 / sad
      const iwb = 1 / sbd
      const iwc = 1 / scd
      const sA = muv ? muv[va * 2] : 0
      const tA = muv ? muv[va * 2 + 1] : 0
      const sB = muv ? muv[vb * 2] : 0
      const tB = muv ? muv[vb * 2 + 1] : 0
      const sC = muv ? muv[vcx * 2] : 0
      const tC = muv ? muv[vcx * 2 + 1] : 0
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
          if (muv) {
            const q0 = w0 * iwa
            const q1 = w1 * iwb
            const q2 = w2 * iwc
            const qs = q0 + q1 + q2
            uvt[i * 2] = (q0 * sA + q1 * sB + q2 * sC) / qs
            uvt[i * 2 + 1] = (q0 * tA + q1 * tB + q2 * tC) / qs
          } else {
            uvt[i * 2] = -1
            uvt[i * 2 + 1] = 0
          }
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
function segment(
  buffer: RasterBuffer,
  target: WorldTarget,
  bias: number,
  ax: number,
  ay: number,
  ad: number,
  bx: number,
  by: number,
  bd: number,
  r: number,
  g: number,
  b: number,
): void {
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
export function paintTarget(
  buffer: RasterBuffer,
  target: WorldTarget,
  world: World,
  view: WorldView,
  style: WorldStyle,
): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  data.fill(0)
  if (target.width !== cols || target.height !== rows || (!world.meshes.length && !world.splats)) return
  const c = cameraOf(world, view, cols, rows)
  const fog = clamp01(style.fog)
  const shadeA = Math.round(clamp01(style.shade) * 255)
  const mat = style.matrix
  const ramp = !style.material && style.ramp && style.ramp.length >= 2 ? style.ramp : null
  const amount = clamp01(style.dither ?? 1)
  const bands = ramp ? ramp.length : 0
  const smooth: [number, number, number] = [0, 0, 0]
  const [fr, fg, fb] = style.fill
  const tex = style.texture && style.texture.width > 0 && style.texture.height > 0 ? style.texture : null
  const uvt = target.uv
  // Palette index + 1 → it glows.
  const glowing = new Uint8Array(257)
  for (const g of world.glows) if (g >= 0 && g < world.palette.length) glowing[g + 1] = 1
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
      if (glowing[idx]) {
        const col = world.palette[idx - 1]
        data[o] = col[0]
        data[o + 1] = col[1]
        data[o + 2] = col[2]
        data[o + 3] = Math.max(v, GLOW_FLOOR) > th ? 255 : shadeA
        continue
      }
      if (tex && uvt[i * 2] >= 0) {
        // The texture's texel under the cell (repeating), its alpha in the shade.
        const tw = tex.width
        const tl = tex.height
        const tx = ((Math.floor(uvt[i * 2] * tw) % tw) + tw) % tw
        const ty = ((Math.floor(uvt[i * 2 + 1] * tl) % tl) + tl) % tl
        const s = (ty * tw + tx) * 4
        data[o] = tex.data[s]
        data[o + 1] = tex.data[s + 1]
        data[o + 2] = tex.data[s + 2]
        data[o + 3] = v * (tex.data[s + 3] / 255) > th ? 255 : shadeA
        continue
      }
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
export function drawOverlays(
  buffer: RasterBuffer,
  target: WorldTarget,
  world: World,
  view: WorldView,
  style: WorldStyle,
): void {
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
export function paintMaterial(
  buffer: RasterBuffer,
  target: WorldTarget,
  world: World,
  view: WorldView,
  style: WorldStyle,
  rgba: Uint8Array,
): void {
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

/** Pack a target's texture coordinates for the GPU: R + G a 16-bit s (tiling
 * coordinates wrapped), B + A a 16-bit t offset by one — 0 where the mesh has
 * no uvs or nothing is drawn. */
export function packUv(target: WorldTarget, out?: Uint8Array): Uint8Array {
  const n = target.width * target.height
  const px = out && out.length === n * 4 ? out : new Uint8Array(n * 4)
  const wrap = (v: number) => (v > 1 || v < 0 ? v - Math.floor(v) : v)
  for (let i = 0; i < n; i++) {
    const s = target.uv[i * 2]
    const o = i * 4
    if (s < 0 || !target.index[i]) {
      px[o] = px[o + 1] = px[o + 2] = px[o + 3] = 0
      continue
    }
    const se = Math.round(wrap(s) * 65535)
    const te = 1 + Math.round(wrap(target.uv[i * 2 + 1]) * 65534)
    px[o] = se >> 8
    px[o + 1] = se & 255
    px[o + 2] = te >> 8
    px[o + 3] = te & 255
  }
  return px
}

let cpuTarget: WorldTarget | null = null

/** One frame on the CPU engine: rasterize, then the shared pass. */
export function paintWorld(buffer: RasterBuffer, world: World, view: WorldView, style: WorldStyle): void {
  if (!cpuTarget || cpuTarget.width !== buffer.width || cpuTarget.height !== buffer.height)
    cpuTarget = createWorldTarget(buffer.width, buffer.height)
  rasterizeWorld(world, view, cpuTarget, style)
  paintTarget(buffer, cpuTarget, world, view, style)
}
