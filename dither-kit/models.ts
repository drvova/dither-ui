// Model files for the dither engine: VRML97 and VRML 1.0 (.wrl), Wavefront
// OBJ and STL (ASCII + binary) parsed into a `World` (world.ts). Lenient by
// design — unknown nodes are walked for children and otherwise ignored, bad
// indices are dropped, nothing throws on a file that is merely odd.

import type { Rgb } from "./palette"
import {
  boxGeometry,
  coneGeometry,
  cylinderGeometry,
  elevationGeometry,
  emptyWorld,
  finishWorld,
  mat4Identity,
  mat4Multiply,
  mat4Rotate,
  mat4Scale,
  mat4Translate,
  meshFrom,
  normalize,
  sphereGeometry,
  transformDirection,
  transformPoint,
  type Geometry,
  type Mat4,
  type Vec3,
  type World,
} from "./world"

export type ModelFormat = "vrml" | "obj" | "stl"

/** Format from a file name or URL (query/hash ignored), null when unknown. */
export function formatOf(name: string): ModelFormat | null {
  const ext = name.split(/[?#]/)[0].toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]
  return ext === "wrl" || ext === "vrml" || ext === "x3dv" ? "vrml" : ext === "obj" ? "obj" : ext === "stl" ? "stl" : null
}

const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes)

const toBytes = (input: string | ArrayBuffer | Uint8Array): Uint8Array =>
  typeof input === "string" ? new TextEncoder().encode(input) : input instanceof Uint8Array ? input : new Uint8Array(input)

function isBinaryStl(bytes: Uint8Array): boolean {
  if (bytes.length < 84) return false
  const count = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(80, true)
  if (84 + count * 50 === bytes.length) return true
  const head = decode(bytes.subarray(0, Math.min(512, bytes.length))).trimStart()
  return !(head.startsWith("solid") && head.includes("facet"))
}

/** Sniff a format from the bytes when the name gives none. */
export function sniffFormat(bytes: Uint8Array): ModelFormat {
  const head = decode(bytes.subarray(0, Math.min(1024, bytes.length))).trimStart()
  if (head.startsWith("#VRML") || head.startsWith("#X3D")) return "vrml"
  if (head.startsWith("solid") && head.includes("facet")) return "stl"
  if (/^(v|vn|vt|f|o|g|mtllib|usemtl|#)\s/m.test(head) && /^(v|f)\s/m.test(head)) return "obj"
  if (bytes.length >= 84 && isBinaryStl(bytes)) return "stl"
  return "vrml"
}

/**
 * Parse any supported model into a World. `format` "auto" takes the sniffed
 * format; `up` "z" swings a z-up file (CAD / printing STLs) to y-up — the
 * default for STL, since VRML and OBJ are y-up by convention.
 */
export function parseWorld(input: string | ArrayBuffer | Uint8Array, format: ModelFormat | "auto" = "auto", opts: { up?: "y" | "z" } = {}): World {
  const bytes = toBytes(input)
  const fmt = format === "auto" ? sniffFormat(bytes) : format
  const world = fmt === "stl" ? parseStl(bytes) : fmt === "obj" ? parseObj(typeof input === "string" ? input : decode(bytes)) : parseVrml(typeof input === "string" ? input : decode(bytes))
  const up = opts.up ?? (fmt === "stl" ? "z" : "y")
  if (up === "z") {
    for (const m of world.meshes)
      for (let i = 0; i < m.positions.length; i += 3) {
        const y = m.positions[i + 1]
        m.positions[i + 1] = m.positions[i + 2]
        m.positions[i + 2] = -y
      }
    for (const l of world.lights) l.direction = [l.direction[0], l.direction[2], -l.direction[1]]
    if (world.viewpoint) world.viewpoint.position = [world.viewpoint.position[0], world.viewpoint.position[2], -world.viewpoint.position[1]]
    finishWorld(world)
  }
  return world
}

// ---- OBJ -----------------------------------------------------------------------

const GREY: Rgb = [204, 204, 204]

export function parseObj(text: string): World {
  const points: number[] = []
  const faces: number[][] = []
  for (const raw of text.split("\n")) {
    const line = raw.trim()
    if (!line || line[0] === "#") continue
    const parts = line.split(/\s+/)
    if (parts[0] === "v" && parts.length >= 4) points.push(+parts[1], +parts[2], +parts[3])
    else if (parts[0] === "f") {
      const count = points.length / 3
      const face: number[] = []
      for (let k = 1; k < parts.length; k++) {
        const idx = parseInt(parts[k], 10)
        if (!Number.isNaN(idx)) face.push(idx < 0 ? count + idx : idx - 1)
      }
      if (face.length >= 3) faces.push(face)
    }
  }
  const world = emptyWorld()
  const mesh = meshFrom({ points, faces }, null, GREY, true)
  if (mesh) world.meshes.push(mesh)
  return finishWorld(world)
}

// ---- STL -----------------------------------------------------------------------

export function parseStl(input: string | ArrayBuffer | Uint8Array): World {
  const bytes = toBytes(input)
  const points: number[] = []
  if (isBinaryStl(bytes)) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    const count = Math.min(view.getUint32(80, true), Math.floor((bytes.length - 84) / 50))
    for (let i = 0; i < count; i++) {
      const o = 84 + i * 50 + 12
      for (let k = 0; k < 9; k++) points.push(view.getFloat32(o + k * 4, true))
    }
  } else {
    const re = /vertex\s+([-+.\deE]+)\s+([-+.\deE]+)\s+([-+.\deE]+)/g
    const text = decode(bytes)
    for (let m = re.exec(text); m; m = re.exec(text)) points.push(+m[1], +m[2], +m[3])
  }
  const tris = Math.floor(points.length / 9)
  const faces: number[][] = []
  for (let t = 0; t < tris; t++) faces.push([t * 3, t * 3 + 1, t * 3 + 2])
  const world = emptyWorld()
  // Winding in the wild is unreliable, so an STL renders two-sided.
  const mesh = meshFrom({ points: points.slice(0, tris * 9), faces }, null, GREY, false)
  if (mesh) world.meshes.push(mesh)
  return finishWorld(world)
}

// ---- VRML: tokens → generic nodes --------------------------------------------

export type VrmlNode = { type: string; fields: Record<string, VrmlValue> }
export type VrmlValue = number[] | string[] | boolean | VrmlNode[]

const BRACKETS = new Set(["{", "}", "[", "]"])

/** `#` comments, quoted strings (kept with a leading `"`), brackets, words;
 * commas are whitespace. */
export function tokenizeVrml(text: string): string[] {
  const out: string[] = []
  const n = text.length
  let i = 0
  while (i < n) {
    const ch = text[i]
    if (ch === "#") {
      while (i < n && text[i] !== "\n") i++
    } else if (ch === '"') {
      let j = i + 1
      let s = '"'
      while (j < n && text[j] !== '"') {
        if (text[j] === "\\" && j + 1 < n) j++
        s += text[j++]
      }
      out.push(s)
      i = j + 1
    } else if (BRACKETS.has(ch)) {
      out.push(ch)
      i++
    } else if (ch <= " " || ch === ",") {
      i++
    } else {
      let j = i
      while (j < n && text[j] > " " && text[j] !== "," && !BRACKETS.has(text[j]) && text[j] !== "#" && text[j] !== '"') j++
      out.push(text.slice(i, j))
      i = j
    }
  }
  return out
}

const isNumber = (t: string | undefined): boolean => t !== undefined && t !== "" && /^[-+.\d]/.test(t) && !Number.isNaN(Number(t))

/** The VRML header picks the grammar: `#VRML V1.0 ascii` is the old scene
 * graph (Separator state machine), everything else reads as VRML97 / X3D. */
export function parseVrmlNodes(text: string): { version: 1 | 2; nodes: VrmlNode[] } {
  const version = /^\s*#VRML\s+V1\.0/i.test(text) ? 1 : 2
  const toks = tokenizeVrml(text)
  const defs = new Map<string, VrmlNode>()
  let i = 0

  const skipBalanced = (open: string, close: string) => {
    if (toks[i] !== open) return
    let depth = 0
    do {
      if (toks[i] === open) depth++
      else if (toks[i] === close) depth--
      i++
    } while (i < toks.length && depth > 0)
  }

  const list = (): VrmlValue => {
    const nums: number[] = []
    const strs: string[] = []
    const nodes: VrmlNode[] = []
    while (i < toks.length && toks[i] !== "]") {
      const t = toks[i]
      if (isNumber(t)) {
        nums.push(Number(t))
        i++
      } else if (t[0] === '"') {
        strs.push(t.slice(1))
        i++
      } else if (t === "TRUE" || t === "FALSE") {
        nums.push(t === "TRUE" ? 1 : 0)
        i++
      } else {
        const node = value()
        if (node) nodes.push(node)
      }
    }
    i++
    return nodes.length ? nodes : strs.length ? strs : nums
  }

  const fields = (node: VrmlNode) => {
    const kids: VrmlNode[] = []
    while (i < toks.length && toks[i] !== "}") {
      const name = toks[i]
      // VRML 1.0 groups hold bare child nodes (`Separator { Material {...} }`):
      // a word directly followed by `{`, or DEF/USE, is a child, not a field.
      if (name === "DEF" || name === "USE" || (toks[i + 1] === "{" && !BRACKETS.has(name) && name[0] !== '"')) {
        const child = value()
        if (child) kids.push(child)
        continue
      }
      i++
      const t = toks[i]
      if (t === undefined || t === "}" || t === "]") break
      if (t === "[") {
        i++
        node.fields[name] = list()
      } else if (t === "TRUE" || t === "FALSE") {
        i++
        node.fields[name] = t === "TRUE"
      } else if (t[0] === '"') {
        i++
        node.fields[name] = [t.slice(1)]
      } else if (isNumber(t)) {
        const nums: number[] = []
        while (isNumber(toks[i])) nums.push(Number(toks[i++]))
        node.fields[name] = nums
      } else if (t === "DEF" || t === "USE" || t === "NULL" || toks[i + 1] === "{") {
        const n = value()
        node.fields[name] = n ? [n] : []
      } else if (t === "IS") {
        i += 2
      } else {
        // An enum word (VRML 1.0: `vertexOrdering COUNTERCLOCKWISE`).
        i++
        node.fields[name] = [t]
      }
    }
    i++
    if (kids.length) node.fields.children = [...children(node, "children"), ...kids]
  }

  /** One node-valued thing: a node, DEF/USE, or a statement to skip. Always
   * consumes at least one token so no input can stall the parser. */
  const value = (): VrmlNode | null => {
    const t = toks[i++]
    if (t === undefined) return null
    if (t === "DEF") {
      const name = toks[i++]
      const node = value()
      if (node && name !== undefined) defs.set(name, node)
      return node
    }
    if (t === "USE") return defs.get(toks[i++]) ?? null
    if (t === "NULL") return null
    if (t === "PROTO") {
      i++
      skipBalanced("[", "]")
      skipBalanced("{", "}")
      return null
    }
    if (t === "EXTERNPROTO") {
      i++
      skipBalanced("[", "]")
      if (toks[i] === "[") skipBalanced("[", "]")
      else i++
      return null
    }
    if (t === "ROUTE") {
      i += 3
      return null
    }
    if (t === "PROFILE" || t === "COMPONENT") {
      i++
      return null
    }
    if (t === "META") {
      i += 2
      return null
    }
    if (t === "UNIT") {
      i += 3
      return null
    }
    if (toks[i] === "{" && !BRACKETS.has(t) && t[0] !== '"') {
      i++
      const node: VrmlNode = { type: t, fields: {} }
      fields(node)
      return node
    }
    return null
  }

  const nodes: VrmlNode[] = []
  while (i < toks.length) {
    const node = value()
    if (node) nodes.push(node)
  }
  return { version, nodes }
}

// ---- VRML: nodes → world -------------------------------------------------------

const nums = (n: VrmlNode, key: string, def: number[]): number[] => {
  const v = n.fields[key]
  return Array.isArray(v) && (v.length === 0 || typeof v[0] === "number") ? (v as number[]) : def
}
const children = (n: VrmlNode, ...keys: string[]): VrmlNode[] => {
  const out: VrmlNode[] = []
  for (const key of keys) {
    const v = n.fields[key]
    if (Array.isArray(v) && typeof v[0] === "object") out.push(...(v as VrmlNode[]))
  }
  return out
}
const flag = (n: VrmlNode, key: string, def: boolean): boolean => {
  const v = n.fields[key]
  return typeof v === "boolean" ? v : def
}
const word = (n: VrmlNode, key: string): string | undefined => {
  const v = n.fields[key]
  return Array.isArray(v) && typeof v[0] === "string" ? v[0] : undefined
}
const vec = (v: number[], def: Vec3): Vec3 => (v.length >= 3 ? [v[0], v[1], v[2]] : def)
const rgbOf = (v: number[]): Rgb =>
  v.length >= 3 ? [Math.round(v[0] * 255), Math.round(v[1] * 255), Math.round(v[2] * 255)] : GREY

/** VRML's Transform: T · C · R · SR · S · -SR · -C. */
export function vrmlTransform(translation: Vec3, rotation: number[], scale: Vec3, scaleOrientation: number[], center: Vec3): Mat4 {
  const axis = (r: number[]): Vec3 => [r[0] ?? 0, r[1] ?? 0, r[2] ?? 1]
  let m = mat4Translate([translation[0] + center[0], translation[1] + center[1], translation[2] + center[2]])
  m = mat4Multiply(m, mat4Rotate(axis(rotation), rotation[3] ?? 0))
  m = mat4Multiply(m, mat4Rotate(axis(scaleOrientation), scaleOrientation[3] ?? 0))
  m = mat4Multiply(m, mat4Scale(scale))
  m = mat4Multiply(m, mat4Rotate(axis(scaleOrientation), -(scaleOrientation[3] ?? 0)))
  return mat4Multiply(m, mat4Translate([-center[0], -center[1], -center[2]]))
}

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

type Built = { geo: Geometry; solid: boolean; ccw: boolean } | null

function geometryOf(g: VrmlNode, points: number[] | null): Built {
  switch (g.type) {
    case "Box":
      return { geo: boxGeometry(vec(nums(g, "size", []), [2, 2, 2])), solid: true, ccw: true }
    case "Cube":
      return { geo: boxGeometry([nums(g, "width", [2])[0], nums(g, "height", [2])[0], nums(g, "depth", [2])[0]]), solid: true, ccw: true }
    case "Sphere":
      return { geo: sphereGeometry(nums(g, "radius", [1])[0]), solid: true, ccw: true }
    case "Cone":
      return { geo: coneGeometry(nums(g, "bottomRadius", [1])[0], nums(g, "height", [2])[0], flag(g, "side", true), flag(g, "bottom", true)), solid: true, ccw: true }
    case "Cylinder":
      return { geo: cylinderGeometry(nums(g, "radius", [1])[0], nums(g, "height", [2])[0], flag(g, "side", true), flag(g, "top", true), flag(g, "bottom", true)), solid: true, ccw: true }
    case "IndexedFaceSet": {
      const coord = children(g, "coord")[0]
      const pts = points ?? (coord ? nums(coord, "point", []) : [])
      return { geo: { points: pts, faces: facesOf(nums(g, "coordIndex", [])) }, solid: flag(g, "solid", true), ccw: flag(g, "ccw", true) }
    }
    case "ElevationGrid":
      return {
        geo: elevationGeometry(nums(g, "xDimension", [0])[0], nums(g, "zDimension", [0])[0], nums(g, "xSpacing", [1])[0], nums(g, "zSpacing", [1])[0], nums(g, "height", [])),
        solid: flag(g, "solid", true),
        ccw: flag(g, "ccw", true),
      }
    default:
      return null
  }
}

function buildV2(nodes: VrmlNode[], world: World): void {
  const walk = (list: VrmlNode[], m: Mat4) => {
    for (const n of list) {
      switch (n.type) {
        case "Transform":
          walk(children(n, "children"), mat4Multiply(m, transformOf(n, "scale")))
          break
        case "Switch": {
          const which = nums(n, "whichChoice", [-1])[0]
          const options = children(n, "choice", "children")
          if (which >= 0 && options[which]) walk([options[which]], m)
          break
        }
        case "LOD":
          walk(children(n, "level", "children").slice(0, 1), m)
          break
        case "Shape": {
          const material = children(children(n, "appearance")[0] ?? n, "material")[0]
          const color = material ? rgbOf(nums(material, "diffuseColor", [])) : GREY
          const geometry = children(n, "geometry")[0]
          const built = geometry ? geometryOf(geometry, null) : null
          const mesh = built && meshFrom(built.geo, m, color, built.solid, built.ccw)
          if (mesh) world.meshes.push(mesh)
          break
        }
        case "DirectionalLight":
          if (flag(n, "on", true))
            world.lights.push({ direction: normalize(transformDirection(m, vec(nums(n, "direction", []), [0, 0, -1]))), intensity: nums(n, "intensity", [1])[0] })
          break
        case "Viewpoint":
          if (!world.viewpoint)
            world.viewpoint = { position: transformPoint(m, vec(nums(n, "position", []), [0, 0, 10])), fov: (nums(n, "fieldOfView", [0.785398])[0] * 180) / Math.PI }
          break
        case "NavigationInfo":
          world.headlight = flag(n, "headlight", true)
          break
        default:
          // Group, Anchor, Billboard, Collision and any grouping PROTO.
          walk(children(n, "children"), m)
      }
    }
  }
  walk(nodes, mat4Identity())
}

type V1State = { m: Mat4; points: number[]; color: Rgb; ccw: boolean | null; solid: boolean }

function buildV1(nodes: VrmlNode[], world: World): void {
  const walk = (list: VrmlNode[], s: V1State) => {
    for (const n of list) {
      const kids = children(n, "children")
      switch (n.type) {
        case "Separator":
        case "WWWAnchor":
        case "LOD": {
          const saved = { ...s }
          walk(n.type === "LOD" ? kids.slice(0, 1) : kids, s)
          Object.assign(s, saved)
          break
        }
        case "TransformSeparator": {
          const m = s.m
          walk(kids, s)
          s.m = m
          break
        }
        case "Switch": {
          const which = nums(n, "whichChild", [-1])[0]
          if (which === -3) walk(kids, s)
          else if (which >= 0 && kids[which]) walk([kids[which]], s)
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
        case "Cube":
        case "Sphere":
        case "Cone":
        case "Cylinder": {
          const built = geometryOf(n, n.type === "IndexedFaceSet" ? s.points : null)
          const faceSet = n.type === "IndexedFaceSet"
          const mesh = built && meshFrom(built.geo, s.m, s.color, faceSet ? s.ccw !== null && s.solid : true, faceSet ? s.ccw !== false : true)
          if (mesh) world.meshes.push(mesh)
          break
        }
        case "PerspectiveCamera":
          if (!world.viewpoint)
            world.viewpoint = { position: transformPoint(s.m, vec(nums(n, "position", []), [0, 0, 1])), fov: (nums(n, "heightAngle", [0.785398])[0] * 180) / Math.PI }
          break
        case "DirectionalLight":
          if (flag(n, "on", true))
            world.lights.push({ direction: normalize(transformDirection(s.m, vec(nums(n, "direction", []), [0, 0, -1]))), intensity: nums(n, "intensity", [1])[0] })
          break
        default:
          walk(kids, s)
      }
    }
  }
  walk(nodes, { m: mat4Identity(), points: [], color: GREY, ccw: null, solid: false })
}

/** VRML97 / X3D classic (`#VRML V2.0 utf8`, `#X3D`) or VRML 1.0 text → World. */
export function parseVrml(text: string): World {
  const { version, nodes } = parseVrmlNodes(text)
  const world = emptyWorld()
  if (version === 1) buildV1(nodes, world)
  else buildV2(nodes, world)
  return finishWorld(world)
}
