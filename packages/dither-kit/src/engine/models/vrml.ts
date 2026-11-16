// VRML's nodes into a world (`../models.ts`): VRML97 / X3D classic
// (`buildV2`, X3D's XML too) and VRML 1.0's Separator state machine
// (`buildV1`), their geometry, materials and the animation ROUTEd into a
// Transform.

import {
  composeTransform,
  mat4Identity,
  mat4Multiply,
  mat4Rotate,
  mat4Scale,
  mat4Translate,
  normalize,
  quatFromAxisAngle,
  transformDirection,
  transformPoint,
  type Mat4,
  type Quat,
  type Vec3,
} from "../world-math"
import {
  boxGeometry,
  coneGeometry,
  cylinderGeometry,
  elevationGeometry,
  sphereGeometry,
  type Geometry,
} from "../world-shapes"
import { addMesh, addNode, emptyWorld, finishWorld, type MeshKind, type Track, type World } from "../world-scene"
import type { Rgb } from "../palette"
import { GREY, MAX_NODES } from "./shared"
import { children, flag, nums, parseVrmlNodes, word, type VrmlNode, type VrmlRoute } from "./vrml-grammar"

const vec = (v: number[], def: Vec3): Vec3 => (v.length >= 3 ? [v[0], v[1], v[2]] : def)
const rgbOf = (v: number[], def: Rgb = GREY): Rgb => (v.length >= 3 ? [v[0] * 255, v[1] * 255, v[2] * 255] : def)
const axisAngle = (r: number[]): Quat => quatFromAxisAngle([r[0] ?? 0, r[1] ?? 0, r[2] ?? 1], r[3] ?? 0)

/** VRML's Transform: T · C · R · SR · S · -SR · -C from axis-angle fields. */
export const vrmlTransform = (
  translation: Vec3,
  rotation: number[],
  scale: Vec3,
  scaleOrientation: number[],
  center: Vec3,
): Mat4 => composeTransform(translation, axisAngle(rotation), scale, center, axisAngle(scaleOrientation))

const transformOf = (n: VrmlNode, scaleKey: string) =>
  vrmlTransform(
    vec(nums(n, "translation", []), [0, 0, 0]),
    nums(n, "rotation", [0, 0, 1, 0]),
    vec(nums(n, scaleKey, []), [1, 1, 1]),
    nums(n, "scaleOrientation", [0, 0, 1, 0]),
    vec(nums(n, "center", []), [0, 0, 0]),
  )

/** `coordIndex` rings split on -1. */
export function facesOf(coordIndex: number[]): number[][] {
  const faces: number[][] = []
  let ring: number[] = []
  for (const idx of coordIndex) {
    if (idx < 0) {
      if (ring.length >= 3) faces.push(ring)
      ring = []
    } else ring.push(idx)
  }
  if (ring.length >= 3) faces.push(ring)
  return faces
}

/** `coordIndex` runs split on -1 (any length — polylines). */
function runsOf(coordIndex: number[]): number[][] {
  const runs: number[][] = []
  let run: number[] = []
  for (const idx of coordIndex) {
    if (idx < 0) {
      if (run.length) runs.push(run)
      run = []
    } else run.push(idx)
  }
  if (run.length) runs.push(run)
  return runs
}

/** Per-face rgb (0-1) from an IndexedFaceSet's Color node, per face or
 * averaged per vertex, honouring colorIndex. */
function faceColors(g: VrmlNode, faces: number[][]): number[] | undefined {
  const colorNode = children(g, "color")[0]
  if (!colorNode) return undefined
  const rgb = nums(colorNode, "color", [])
  const stride = colorNode.type === "ColorRGBA" ? 4 : 3
  const count = Math.floor(rgb.length / stride)
  if (!count) return undefined
  const at = (i: number): number[] => {
    const k = Math.max(0, Math.min(count - 1, i)) * stride
    return [rgb[k], rgb[k + 1], rgb[k + 2]]
  }
  const colorIndex = nums(g, "colorIndex", [])
  const out: number[] = []
  if (!flag(g, "colorPerVertex", true)) {
    faces.forEach((_, f) => out.push(...at(colorIndex.length ? (colorIndex[f] ?? 0) : f)))
    return out
  }
  const rings = colorIndex.length ? runsOf(colorIndex) : faces
  faces.forEach((face, f) => {
    const ring = rings[f] ?? face
    let r = 0
    let gg = 0
    let b = 0
    for (const i of ring) {
      const c = at(i)
      r += c[0]
      gg += c[1]
      b += c[2]
    }
    const n = ring.length || 1
    out.push(r / n, gg / n, b / n)
  })
  return out
}

type Built = { geo: Geometry; solid: boolean; ccw: boolean; kind: MeshKind } | null

function geometryOf(g: VrmlNode, points: number[] | null): Built {
  switch (g.type) {
    case "Box":
      return { geo: boxGeometry(vec(nums(g, "size", []), [2, 2, 2])), solid: true, ccw: true, kind: "faces" }
    case "Cube":
      return {
        geo: boxGeometry([nums(g, "width", [2])[0], nums(g, "height", [2])[0], nums(g, "depth", [2])[0]]),
        solid: true,
        ccw: true,
        kind: "faces",
      }
    case "Sphere":
      return { geo: sphereGeometry(nums(g, "radius", [1])[0]), solid: true, ccw: true, kind: "faces" }
    case "Cone":
      return {
        geo: coneGeometry(
          nums(g, "bottomRadius", [1])[0],
          nums(g, "height", [2])[0],
          flag(g, "side", true),
          flag(g, "bottom", true),
        ),
        solid: true,
        ccw: true,
        kind: "faces",
      }
    case "Cylinder":
      return {
        geo: cylinderGeometry(
          nums(g, "radius", [1])[0],
          nums(g, "height", [2])[0],
          flag(g, "side", true),
          flag(g, "top", true),
          flag(g, "bottom", true),
        ),
        solid: true,
        ccw: true,
        kind: "faces",
      }
    case "IndexedFaceSet":
    case "IndexedTriangleSet": {
      const coord = children(g, "coord")[0]
      const pts = points ?? (coord ? nums(coord, "point", []) : [])
      const faces =
        g.type === "IndexedTriangleSet" ? triplesOf(nums(g, "index", [])) : facesOf(nums(g, "coordIndex", []))
      // TextureCoordinate's t runs upward; the kit's runs down from the top-left.
      // Without a texCoordIndex the coordinates follow the points.
      const texCoord = children(g, "texCoord")[0]
      const st = texCoord ? nums(texCoord, "point", []) : []
      const uvs = st.length ? st.map((v, i) => (i % 2 ? 1 - v : v)) : undefined
      const tci = uvs && g.type === "IndexedFaceSet" ? nums(g, "texCoordIndex", []) : []
      return {
        geo: { points: pts, faces, colors: faceColors(g, faces), uvs, faceUvs: tci.length ? facesOf(tci) : undefined },
        solid: flag(g, "solid", true),
        ccw: flag(g, "ccw", true),
        kind: "faces",
      }
    }
    case "TriangleSet": {
      const coord = children(g, "coord")[0]
      const pts = points ?? (coord ? nums(coord, "point", []) : [])
      const faces: number[][] = []
      for (let i = 0; i + 2 < pts.length / 3; i += 3) faces.push([i, i + 1, i + 2])
      return { geo: { points: pts, faces }, solid: flag(g, "solid", true), ccw: flag(g, "ccw", true), kind: "faces" }
    }
    case "IndexedLineSet": {
      const coord = children(g, "coord")[0]
      const pts = points ?? (coord ? nums(coord, "point", []) : [])
      return { geo: { points: pts, faces: runsOf(nums(g, "coordIndex", [])) }, solid: false, ccw: true, kind: "lines" }
    }
    case "PointSet": {
      const coord = children(g, "coord")[0]
      const pts = points ?? (coord ? nums(coord, "point", []) : [])
      return { geo: { points: pts, faces: [] }, solid: false, ccw: true, kind: "points" }
    }
    case "ElevationGrid":
      return {
        geo: elevationGeometry(
          nums(g, "xDimension", [0])[0],
          nums(g, "zDimension", [0])[0],
          nums(g, "xSpacing", [1])[0],
          nums(g, "zSpacing", [1])[0],
          nums(g, "height", []),
        ),
        solid: flag(g, "solid", true),
        ccw: flag(g, "ccw", true),
        kind: "faces",
      }
    default:
      return null
  }
}

function triplesOf(index: number[]): number[][] {
  const out: number[][] = []
  for (let i = 0; i + 2 < index.length; i += 3) out.push([index[i], index[i + 1], index[i + 2]])
  return out
}

/** The Material colour for a shape: its emissive colour when it has one
 * (faces then give off light: `glow`), else its diffuse. Lines and points
 * are drawn at full strength either way. */
function materialColor(shape: VrmlNode, kind: MeshKind): { color: Rgb; glow: boolean } {
  const material = children(children(shape, "appearance")[0] ?? shape, "material")[0]
  if (!material) return { color: GREY, glow: false }
  const diffuse = rgbOf(nums(material, "diffuseColor", []), [204, 204, 204])
  const emissive = nums(material, "emissiveColor", [])
  const lit = emissive.length >= 3 && emissive[0] + emissive[1] + emissive[2] > 0
  return lit ? { color: rgbOf(emissive), glow: kind === "faces" } : { color: diffuse, glow: false }
}

const TIME_FIELDS = new Set(["set_fraction", "fraction"])
const NODE_FIELDS: Record<string, "translation" | "rotation" | "scale"> = {
  set_translation: "translation",
  translation: "translation",
  set_rotation: "rotation",
  rotation: "rotation",
  set_scale: "scale",
  scale: "scale",
}

/** The tracks ROUTEd into a DEF'd Transform: interpolators driven by TimeSensors. */
function tracksFor(
  name: string,
  routes: VrmlRoute[],
  byName: Map<string, VrmlNode>,
): { translation?: Track; rotation?: Track; scale?: Track } {
  const out: { translation?: Track; rotation?: Track; scale?: Track } = {}
  for (const r of routes) {
    const field = r.to === name ? NODE_FIELDS[r.toField] : undefined
    if (!field) continue
    const interp = byName.get(r.from)
    if (!interp || !/Interpolator$/.test(interp.type)) continue
    const clockRoute = routes.find((q) => q.to === r.from && TIME_FIELDS.has(q.toField))
    const clock = clockRoute && byName.get(clockRoute.from)
    if (!clock || clock.type !== "TimeSensor") continue
    const cycle = nums(clock, "cycleInterval", [1])[0] || 1
    const loop = flag(clock, "loop", false)
    const startRaw = nums(clock, "startTime", [0])[0]
    const start = Number.isFinite(startRaw) && startRaw < 1e6 ? startRaw : 0
    const keys = nums(interp, "key", []).map((k) => k * cycle)
    const raw = nums(interp, "keyValue", [])
    const rotation = interp.type === "OrientationInterpolator"
    const stride = rotation ? 4 : 3
    if (!keys.length || raw.length < keys.length * stride) continue
    const value: number[] = []
    for (let k = 0; k < keys.length; k++) {
      if (rotation) value.push(...quatFromAxisAngle([raw[k * 4], raw[k * 4 + 1], raw[k * 4 + 2]], raw[k * 4 + 3]))
      else value.push(raw[k * 3], raw[k * 3 + 1], raw[k * 3 + 2])
    }
    if (field === "rotation" && !rotation) continue
    if (field !== "rotation" && rotation) continue
    out[field] = { key: keys, value, stride, kind: rotation ? "slerp" : "lerp", duration: cycle, loop, start }
  }
  return out
}

export function buildV2(nodes: VrmlNode[], routes: VrmlRoute[], world: World): void {
  const byName = new Map<string, VrmlNode>()
  let visits = 0
  const index = (list: VrmlNode[], depth: number) => {
    for (const n of list) {
      if (++visits > MAX_NODES) return
      if (n.name) byName.set(n.name, n)
      if (depth < 64)
        for (const v of Object.values(n.fields))
          if (Array.isArray(v) && typeof v[0] === "object") index(v as VrmlNode[], depth + 1)
    }
  }
  index(nodes, 0)
  visits = 0
  const animatedNames = new Set(
    routes.map((r) => r.to).filter((name) => NODE_FIELDS[routes.find((r) => r.to === name)?.toField ?? ""]),
  )

  const walk = (list: VrmlNode[], m: Mat4, parent: number, depth: number) => {
    if (depth > 64) return
    for (const n of list) {
      if (++visits > MAX_NODES) return
      switch (n.type) {
        case "Transform": {
          const tracks = n.name && animatedNames.has(n.name) ? tracksFor(n.name, routes, byName) : {}
          if (tracks.translation || tracks.rotation || tracks.scale) {
            const node = addNode(world, {
              parent,
              pre: m,
              translation: vec(nums(n, "translation", []), [0, 0, 0]),
              rotation: axisAngle(nums(n, "rotation", [0, 0, 1, 0])),
              scale: vec(nums(n, "scale", []), [1, 1, 1]),
              center: vec(nums(n, "center", []), [0, 0, 0]),
              scaleOrientation: axisAngle(nums(n, "scaleOrientation", [0, 0, 1, 0])),
              tracks,
            })
            walk(children(n, "children"), mat4Identity(), node, depth + 1)
          } else walk(children(n, "children"), mat4Multiply(m, transformOf(n, "scale")), parent, depth + 1)
          break
        }
        case "Switch": {
          const which = nums(n, "whichChoice", [-1])[0]
          const options = children(n, "choice", "children")
          if (which >= 0 && options[which]) walk([options[which]], m, parent, depth + 1)
          break
        }
        case "LOD":
          walk(children(n, "level", "children").slice(0, 1), m, parent, depth + 1)
          break
        case "Shape": {
          const geometry = children(n, "geometry")[0]
          const built = geometry ? geometryOf(geometry, null) : null
          if (built) {
            const { color, glow } = materialColor(n, built.kind)
            addMesh(world, built.geo, m, color, built.solid, {
              ccw: built.ccw,
              kind: built.kind,
              node: parent,
              glow,
            })
          }
          break
        }
        case "DirectionalLight":
          if (flag(n, "on", true))
            world.lights.push({
              direction: normalize(transformDirection(m, vec(nums(n, "direction", []), [0, 0, -1]))),
              intensity: nums(n, "intensity", [1])[0],
            })
          break
        case "Viewpoint":
          if (!world.viewpoint)
            world.viewpoint = {
              position: transformPoint(m, vec(nums(n, "position", []), [0, 0, 10])),
              fov: (nums(n, "fieldOfView", [0.785398])[0] * 180) / Math.PI,
            }
          break
        case "NavigationInfo":
          world.headlight = flag(n, "headlight", true)
          break
        default:
          // Group, Anchor, Billboard, Collision and any grouping PROTO.
          walk(children(n, "children"), m, parent, depth + 1)
      }
    }
  }
  walk(nodes, mat4Identity(), -1, 0)
}

type V1State = { m: Mat4; points: number[]; color: Rgb; ccw: boolean | null; solid: boolean }

function buildV1(nodes: VrmlNode[], world: World): void {
  let visits = 0
  const walk = (list: VrmlNode[], s: V1State, depth: number) => {
    if (depth > 64) return
    for (const n of list) {
      if (++visits > MAX_NODES) return
      const kids = children(n, "children")
      switch (n.type) {
        case "Separator":
        case "WWWAnchor":
        case "LOD": {
          const saved = { ...s }
          walk(n.type === "LOD" ? kids.slice(0, 1) : kids, s, depth + 1)
          Object.assign(s, saved)
          break
        }
        case "TransformSeparator": {
          const m = s.m
          walk(kids, s, depth + 1)
          s.m = m
          break
        }
        case "Switch": {
          const which = nums(n, "whichChild", [-1])[0]
          if (which === -3) walk(kids, s, depth + 1)
          else if (which >= 0 && kids[which]) walk([kids[which]], s, depth + 1)
          break
        }
        case "Translation":
          s.m = mat4Multiply(s.m, mat4Translate(vec(nums(n, "translation", []), [0, 0, 0])))
          break
        case "Rotation": {
          const r = nums(n, "rotation", [0, 0, 1, 0])
          s.m = mat4Multiply(s.m, mat4Rotate([r[0] ?? 0, r[1] ?? 0, r[2] ?? 1], r[3] ?? 0))
          break
        }
        case "Scale":
          s.m = mat4Multiply(s.m, mat4Scale(vec(nums(n, "scaleFactor", []), [1, 1, 1])))
          break
        case "Transform":
          s.m = mat4Multiply(s.m, transformOf(n, "scaleFactor"))
          break
        case "MatrixTransform": {
          const v = nums(n, "matrix", [])
          // VRML 1.0 writes row-vector matrices (p' = p M, translation in the
          // last row) — read in order that is exactly our column-major layout.
          if (v.length === 16) s.m = mat4Multiply(s.m, v)
          break
        }
        case "Coordinate3":
          s.points = nums(n, "point", [])
          break
        case "Material":
          s.color = rgbOf(nums(n, "diffuseColor", []))
          break
        case "ShapeHints": {
          const order = word(n, "vertexOrdering")
          s.ccw = order === "COUNTERCLOCKWISE" ? true : order === "CLOCKWISE" ? false : null
          s.solid = word(n, "shapeType") === "SOLID"
          break
        }
        case "IndexedFaceSet":
        case "IndexedLineSet":
        case "PointSet":
        case "Cube":
        case "Sphere":
        case "Cone":
        case "Cylinder": {
          const faceSet = n.type === "IndexedFaceSet"
          const built = geometryOf(
            n,
            n.type === "IndexedFaceSet" || n.type === "IndexedLineSet" || n.type === "PointSet" ? s.points : null,
          )
          if (built)
            addMesh(world, built.geo, s.m, s.color, faceSet ? s.ccw !== null && s.solid : built.solid, {
              ccw: faceSet ? s.ccw !== false : true,
              kind: built.kind,
            })
          break
        }
        case "PerspectiveCamera":
          if (!world.viewpoint)
            world.viewpoint = {
              position: transformPoint(s.m, vec(nums(n, "position", []), [0, 0, 1])),
              fov: (nums(n, "heightAngle", [0.785398])[0] * 180) / Math.PI,
            }
          break
        case "DirectionalLight":
          if (flag(n, "on", true))
            world.lights.push({
              direction: normalize(transformDirection(s.m, vec(nums(n, "direction", []), [0, 0, -1]))),
              intensity: nums(n, "intensity", [1])[0],
            })
          break
        default:
          walk(kids, s, depth + 1)
      }
    }
  }
  walk(nodes, { m: mat4Identity(), points: [], color: GREY, ccw: null, solid: false }, 0)
}

/** VRML97 / X3D classic (`#VRML V2.0 utf8`, `#X3D`) or VRML 1.0 text → World. */
export function parseVrml(text: string): World {
  const { version, nodes, routes } = parseVrmlNodes(text)
  const world = emptyWorld()
  if (version === 1) buildV1(nodes, world)
  else buildV2(nodes, routes, world)
  return finishWorld(world)
}
