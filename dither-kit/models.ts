// Model files for the dither engine, parsed into a `World` (world.ts):
// VRML97 / X3D classic and VRML 1.0 (.wrl), X3D XML (.x3d), glTF 2.0 (.gltf
// with data: URIs or pre-fetched buffers, .glb), Wavefront OBJ (+ MTL
// colours), STL (ASCII + binary), PLY (ASCII + binary) and OFF. Lenient by
// design — unknown nodes are walked for children and otherwise ignored, bad
// indices are dropped, nothing throws on a file that is merely odd. Files
// that animate (VRML TimeSensor → interpolator → ROUTE, glTF animations)
// become tracks on world nodes, sampled by the renderer at the kit clock.

import type { Rgb } from "./palette"
import {
  addMesh,
  addNode,
  boxGeometry,
  composeTransform,
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
  normalize,
  quatFromAxisAngle,
  quatNormalize,
  QUAT_IDENTITY,
  sphereGeometry,
  transformDirection,
  transformPoint,
  type Geometry,
  type Mat4,
  type MeshKind,
  type Quat,
  type Track,
  type Vec3,
  type World,
} from "./world"

export type ModelFormat = "vrml" | "x3d" | "obj" | "stl" | "ply" | "off" | "gltf"

/** Format from a file name or URL (query/hash ignored), null when unknown. */
export function formatOf(name: string): ModelFormat | null {
  const ext = name.split(/[?#]/)[0].toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]
  switch (ext) {
    case "wrl":
    case "vrml":
    case "x3dv":
      return "vrml"
    case "x3d":
      return "x3d"
    case "obj":
      return "obj"
    case "stl":
      return "stl"
    case "ply":
      return "ply"
    case "off":
      return "off"
    case "gltf":
    case "glb":
      return "gltf"
    default:
      return null
  }
}

const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes)

const toBytes = (input: string | ArrayBuffer | Uint8Array): Uint8Array =>
  typeof input === "string" ? new TextEncoder().encode(input) : input instanceof Uint8Array ? input : new Uint8Array(input)

const GREY: Rgb = [204, 204, 204]

function isBinaryStl(bytes: Uint8Array): boolean {
  if (bytes.length < 84) return false
  const count = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(80, true)
  if (84 + count * 50 === bytes.length) return true
  const head = decode(bytes.subarray(0, Math.min(512, bytes.length))).trimStart()
  return !(head.startsWith("solid") && head.includes("facet"))
}

/** Sniff a format from the bytes when the name gives none. */
export function sniffFormat(bytes: Uint8Array): ModelFormat {
  if (bytes.length >= 12 && bytes[0] === 0x67 && bytes[1] === 0x6c && bytes[2] === 0x54 && bytes[3] === 0x46) return "gltf"
  const head = decode(bytes.subarray(0, Math.min(1024, bytes.length))).trimStart()
  if (head.startsWith("#VRML") || head.startsWith("#X3D")) return "vrml"
  if (head.startsWith("<")) return "x3d"
  if (head.startsWith("{") && /"asset"/.test(head)) return "gltf"
  if (/^ply\s/.test(head)) return "ply"
  if (/^(C|N|4|ST)*OFF\s/.test(head)) return "off"
  if (head.startsWith("solid") && head.includes("facet")) return "stl"
  if (/^(v|vn|vt|f|o|g|mtllib|usemtl|#)\s/m.test(head) && /^(v|f)\s/m.test(head)) return "obj"
  if (bytes.length >= 84 && isBinaryStl(bytes)) return "stl"
  return "vrml"
}

export type ParseOptions = {
  /** "z" swings a z-up file (CAD / printing STLs) to y-up — the default for STL. */
  up?: "y" | "z"
  /** Files the model references by relative URI (glTF buffers, OBJ .mtl), pre-fetched by the caller. */
  resources?: Record<string, ArrayBuffer | Uint8Array | string>
}

/** Relative URIs a file needs before it can be parsed completely (glTF
 * buffers without a data: URI, an OBJ's mtllib). */
export function externalResources(input: string | ArrayBuffer | Uint8Array, format: ModelFormat | "auto" = "auto"): string[] {
  const bytes = toBytes(input)
  const fmt = format === "auto" ? sniffFormat(bytes) : format
  if (fmt === "obj") {
    const text = typeof input === "string" ? input : decode(bytes)
    return [...text.matchAll(/^\s*mtllib\s+(.+?)\s*$/gm)].flatMap((m) => m[1].split(/\s+/))
  }
  if (fmt === "gltf") {
    const json = gltfJson(bytes)?.json
    const out: string[] = []
    for (const b of (json?.buffers ?? []) as { uri?: string }[]) if (b.uri && !b.uri.startsWith("data:")) out.push(b.uri)
    return out
  }
  return []
}

/** Parse any supported model into a World. `format` "auto" sniffs the bytes. */
export function parseWorld(input: string | ArrayBuffer | Uint8Array, format: ModelFormat | "auto" = "auto", opts: ParseOptions = {}): World {
  const bytes = toBytes(input)
  const fmt = format === "auto" ? sniffFormat(bytes) : format
  const text = () => (typeof input === "string" ? input : decode(bytes))
  const res = opts.resources ?? {}
  const world =
    fmt === "stl"
      ? parseStl(bytes)
      : fmt === "obj"
        ? parseObj(text(), objMaterials(res, text()))
        : fmt === "ply"
          ? parsePly(bytes)
          : fmt === "off"
            ? parseOff(text())
            : fmt === "gltf"
              ? parseGltf(bytes, res)
              : fmt === "x3d"
                ? parseX3d(text())
                : parseVrml(text())
  const up = opts.up ?? (fmt === "stl" ? "z" : "y")
  if (up === "z") {
    const swing = mat4Rotate([1, 0, 0], -Math.PI / 2)
    for (const m of world.meshes)
      if (m.node < 0)
        for (let i = 0; i < m.positions.length; i += 3) {
          const y = m.positions[i + 1]
          m.positions[i + 1] = m.positions[i + 2]
          m.positions[i + 2] = -y
        }
    for (const n of world.nodes) if (n.parent < 0) n.pre = mat4Multiply(swing, n.pre)
    for (const l of world.lights) l.direction = [l.direction[0], l.direction[2], -l.direction[1]]
    if (world.viewpoint) world.viewpoint.position = [world.viewpoint.position[0], world.viewpoint.position[2], -world.viewpoint.position[1]]
    finishWorld(world)
  }
  return world
}

// ---- OBJ + MTL --------------------------------------------------------------------

/** `newmtl` → diffuse colour (Kd) from MTL text. */
export function parseMtl(text: string): Record<string, Rgb> {
  const out: Record<string, Rgb> = {}
  let current = ""
  for (const raw of text.split("\n")) {
    const parts = raw.trim().split(/\s+/)
    if (parts[0] === "newmtl") current = parts.slice(1).join(" ")
    else if (parts[0] === "Kd" && current && parts.length >= 4) out[current] = [+parts[1] * 255, +parts[2] * 255, +parts[3] * 255]
  }
  return out
}

function objMaterials(res: Record<string, ArrayBuffer | Uint8Array | string>, obj: string): Record<string, Rgb> {
  let out: Record<string, Rgb> = {}
  for (const uri of externalResources(obj, "obj")) {
    const r = res[uri]
    if (r !== undefined) out = { ...out, ...parseMtl(typeof r === "string" ? r : decode(toBytes(r))) }
  }
  return out
}

/** Wavefront OBJ: v/f (slashes, negative indices, polygons), l polylines,
 * p points, usemtl groups coloured from `materials` (an MTL's Kd table),
 * vertex colours (`v x y z r g b`) averaged per face. */
export function parseObj(text: string, materials: Record<string, Rgb> = {}): World {
  const points: number[] = []
  const vcol: number[] = []
  let hasVcol = false
  type Group = { material: string; faces: number[][]; lines: number[][]; pts: number[] }
  const groups: Group[] = []
  let g: Group = { material: "", faces: [], lines: [], pts: [] }
  groups.push(g)
  const idx = (tok: string, count: number) => {
    const i = parseInt(tok, 10)
    return Number.isNaN(i) ? -1 : i < 0 ? count + i : i - 1
  }
  for (const raw of text.split("\n")) {
    const line = raw.trim()
    if (!line || line[0] === "#") continue
    const parts = line.split(/\s+/)
    const count = points.length / 3
    switch (parts[0]) {
      case "v":
        if (parts.length >= 4) {
          points.push(+parts[1], +parts[2], +parts[3])
          if (parts.length >= 7) {
            vcol.push(+parts[4], +parts[5], +parts[6])
            hasVcol = true
          } else vcol.push(0.8, 0.8, 0.8)
        }
        break
      case "f": {
        const face: number[] = []
        for (let k = 1; k < parts.length; k++) face.push(idx(parts[k], count))
        if (face.length >= 3) g.faces.push(face)
        break
      }
      case "l": {
        const poly: number[] = []
        for (let k = 1; k < parts.length; k++) poly.push(idx(parts[k], count))
        if (poly.length >= 2) g.lines.push(poly)
        break
      }
      case "p":
        for (let k = 1; k < parts.length; k++) g.pts.push(idx(parts[k], count))
        break
      case "usemtl":
        g = { material: parts.slice(1).join(" "), faces: [], lines: [], pts: [] }
        groups.push(g)
        break
    }
  }
  const world = emptyWorld()
  for (const grp of groups) {
    const color = materials[grp.material] ?? GREY
    if (grp.faces.length) {
      const colors = hasVcol ? grp.faces.flatMap((f) => average(vcol, f)) : undefined
      addMesh(world, { points, faces: grp.faces, colors }, null, color, true)
    }
    if (grp.lines.length) addMesh(world, { points, faces: grp.lines }, null, color, false, { kind: "lines" })
    if (grp.pts.length) addMesh(world, { points, faces: [grp.pts] }, null, color, false, { kind: "points" })
  }
  return finishWorld(world)
}

/** Mean rgb (0-1 triples) of a ring's vertices. */
function average(colors: number[], ring: number[]): number[] {
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  for (const i of ring) {
    if (i < 0 || i * 3 + 2 >= colors.length) continue
    r += colors[i * 3]
    g += colors[i * 3 + 1]
    b += colors[i * 3 + 2]
    n++
  }
  return n ? [r / n, g / n, b / n] : [0.8, 0.8, 0.8]
}

// ---- STL ----------------------------------------------------------------------------

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
  addMesh(world, { points: points.slice(0, tris * 9), faces }, null, GREY, false)
  return finishWorld(world)
}

// ---- PLY ----------------------------------------------------------------------------

const PLY_SIZE: Record<string, number> = { char: 1, int8: 1, uchar: 1, uint8: 1, short: 2, int16: 2, ushort: 2, uint16: 2, int: 4, int32: 4, uint: 4, uint32: 4, float: 4, float32: 4, double: 8, float64: 8 }

function plyRead(view: DataView, offset: number, type: string, little: boolean): number {
  switch (type) {
    case "char":
    case "int8":
      return view.getInt8(offset)
    case "uchar":
    case "uint8":
      return view.getUint8(offset)
    case "short":
    case "int16":
      return view.getInt16(offset, little)
    case "ushort":
    case "uint16":
      return view.getUint16(offset, little)
    case "int":
    case "int32":
      return view.getInt32(offset, little)
    case "uint":
    case "uint32":
      return view.getUint32(offset, little)
    case "double":
    case "float64":
      return view.getFloat64(offset, little)
    default:
      return view.getFloat32(offset, little)
  }
}

/** Stanford PLY: vertex x/y/z (+ red/green/blue), face vertex_indices
 * (+ colour), edge vertex1/vertex2; ASCII, binary little and big endian. A
 * file without faces is a point cloud. */
export function parsePly(input: string | ArrayBuffer | Uint8Array): World {
  const bytes = toBytes(input)
  const headEnd = decode(bytes.subarray(0, Math.min(bytes.length, 65536))).indexOf("end_header")
  const world = emptyWorld()
  if (headEnd < 0) return finishWorld(world)
  const headerText = decode(bytes.subarray(0, headEnd))
  let bodyStart = new TextEncoder().encode(headerText + "end_header").length
  while (bodyStart < bytes.length && bytes[bodyStart] !== 0x0a) bodyStart++
  bodyStart++
  type Prop = { name: string; type: string; list?: { count: string; item: string } }
  type Element = { name: string; count: number; props: Prop[] }
  const elements: Element[] = []
  let format = "ascii"
  for (const raw of headerText.split("\n")) {
    const p = raw.trim().split(/\s+/)
    if (p[0] === "format") format = p[1]
    else if (p[0] === "element") elements.push({ name: p[1], count: +p[2] || 0, props: [] })
    else if (p[0] === "property" && elements.length) {
      const el = elements[elements.length - 1]
      if (p[1] === "list") el.props.push({ name: p[4], type: "list", list: { count: p[2], item: p[3] } })
      else el.props.push({ name: p[2], type: p[1] })
    }
  }
  const points: number[] = []
  const vcol: number[] = []
  let hasVcol = false
  const faces: number[][] = []
  const fcol: number[] = []
  let hasFcol = false
  const edges: number[][] = []
  const take = (el: Element, row: Record<string, number | number[]>) => {
    if (el.name === "vertex") {
      points.push(+(row.x ?? 0), +(row.y ?? 0), +(row.z ?? 0))
      const r = row.red ?? row.r
      const g = row.green ?? row.g
      const b = row.blue ?? row.b
      if (typeof r === "number" && typeof g === "number" && typeof b === "number") {
        hasVcol = true
        vcol.push(r / 255, g / 255, b / 255)
      } else vcol.push(0.8, 0.8, 0.8)
    } else if (el.name === "face") {
      const idx = row.vertex_indices ?? row.vertex_index
      if (Array.isArray(idx) && idx.length >= 3) {
        faces.push(idx)
        const r = row.red ?? row.r
        const g = row.green ?? row.g
        const b = row.blue ?? row.b
        if (typeof r === "number" && typeof g === "number" && typeof b === "number") {
          hasFcol = true
          fcol.push(r / 255, g / 255, b / 255)
        } else fcol.push(-1, -1, -1)
      }
    } else if (el.name === "edge" && typeof row.vertex1 === "number" && typeof row.vertex2 === "number") edges.push([row.vertex1, row.vertex2])
  }
  if (format === "ascii") {
    const toks = decode(bytes.subarray(bodyStart)).split(/\s+/).filter(Boolean)
    let i = 0
    for (const el of elements)
      for (let n = 0; n < el.count && i < toks.length; n++) {
        const row: Record<string, number | number[]> = {}
        for (const prop of el.props) {
          if (prop.list) {
            const count = +toks[i++]
            const list: number[] = []
            for (let k = 0; k < count; k++) list.push(+toks[i++])
            row[prop.name] = list
          } else row[prop.name] = +toks[i++]
        }
        take(el, row)
      }
  } else {
    const little = format !== "binary_big_endian"
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    let o = bodyStart
    for (const el of elements)
      for (let n = 0; n < el.count && o < bytes.length; n++) {
        const row: Record<string, number | number[]> = {}
        for (const prop of el.props) {
          if (prop.list) {
            const count = plyRead(view, o, prop.list.count, little)
            o += PLY_SIZE[prop.list.count] ?? 1
            const list: number[] = []
            for (let k = 0; k < count; k++) {
              list.push(plyRead(view, o, prop.list.item, little))
              o += PLY_SIZE[prop.list.item] ?? 4
            }
            row[prop.name] = list
          } else {
            row[prop.name] = plyRead(view, o, prop.type, little)
            o += PLY_SIZE[prop.type] ?? 4
          }
        }
        take(el, row)
      }
  }
  if (faces.length) {
    const colors = hasFcol
      ? faces.map((f, i) => (fcol[i * 3] >= 0 ? fcol.slice(i * 3, i * 3 + 3) : hasVcol ? average(vcol, f) : [0.8, 0.8, 0.8])).flat()
      : hasVcol
        ? faces.flatMap((f) => average(vcol, f))
        : undefined
    addMesh(world, { points, faces, colors }, null, GREY, false)
  }
  if (edges.length) addMesh(world, { points, faces: edges }, null, GREY, false, { kind: "lines" })
  if (!faces.length && !edges.length && points.length) addMesh(world, { points, faces: [] }, null, GREY, false, { kind: "points" })
  return finishWorld(world)
}

// ---- OFF ----------------------------------------------------------------------------

/** Object File Format: counts, vertices, faces with optional colour. */
export function parseOff(text: string): World {
  const toks = text
    .split("\n")
    .map((l) => l.replace(/#.*/, "").trim())
    .filter(Boolean)
    .join(" ")
    .split(/\s+/)
  let i = 0
  if (/OFF$/.test(toks[0] ?? "")) i++
  const nv = +toks[i++] || 0
  const nf = +toks[i++] || 0
  i++
  const points: number[] = []
  for (let v = 0; v < nv && i + 2 < toks.length; v++) {
    points.push(+toks[i], +toks[i + 1], +toks[i + 2])
    i += 3
  }
  const faces: number[][] = []
  const colors: number[] = []
  let hasColor = false
  for (let f = 0; f < nf && i < toks.length; f++) {
    const n = +toks[i++] || 0
    const face: number[] = []
    for (let k = 0; k < n; k++) face.push(+toks[i++])
    // Trailing colour: 3-4 ints (0-255) or floats (0-1) before the next count.
    const rest: number[] = []
    while (rest.length < 4 && i < toks.length && f + 1 < nf && !Number.isNaN(+toks[i]) && !(rest.length >= 3 && Number.isInteger(+toks[i]) && +toks[i] === +toks[i] && isCountAhead(toks, i))) rest.push(+toks[i++])
    if (f + 1 === nf) while (rest.length < 4 && i < toks.length && !Number.isNaN(+toks[i])) rest.push(+toks[i++])
    if (face.length >= 3) {
      faces.push(face)
      if (rest.length >= 3) {
        hasColor = true
        const scale = rest.some((v) => v > 1) ? 1 / 255 : 1
        colors.push(rest[0] * scale, rest[1] * scale, rest[2] * scale)
      } else colors.push(0.8, 0.8, 0.8)
    }
  }
  const world = emptyWorld()
  addMesh(world, { points, faces, colors: hasColor ? colors : undefined }, null, GREY, false)
  return finishWorld(world)
}

/** OFF ambiguity: after a face, is `toks[i]` the next face's vertex count
 * (an integer followed by that many integer indices)? */
function isCountAhead(toks: string[], i: number): boolean {
  const n = +toks[i]
  if (!Number.isInteger(n) || n < 3 || i + n >= toks.length) return false
  for (let k = 1; k <= n; k++) if (!Number.isInteger(+toks[i + k]) || +toks[i + k] < 0) return false
  return true
}

// ---- glTF 2.0 ------------------------------------------------------------------------

type GltfJson = Record<string, any>

function gltfJson(bytes: Uint8Array): { json: GltfJson; bin: Uint8Array | null } | null {
  try {
    if (bytes.length >= 12 && bytes[0] === 0x67 && bytes[1] === 0x6c && bytes[2] === 0x54 && bytes[3] === 0x46) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
      let o = 12
      let json: GltfJson | null = null
      let bin: Uint8Array | null = null
      while (o + 8 <= bytes.length) {
        const len = view.getUint32(o, true)
        const type = view.getUint32(o + 4, true)
        const chunk = bytes.subarray(o + 8, o + 8 + len)
        if (type === 0x4e4f534a) json = JSON.parse(decode(chunk))
        else if (type === 0x004e4942) bin = chunk
        o += 8 + len
      }
      return json ? { json, bin } : null
    }
    return { json: JSON.parse(decode(bytes)), bin: null }
  } catch {
    return null
  }
}

function base64Bytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

const GLTF_COMPONENTS: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }
const GLTF_SIZE: Record<number, number> = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }

/** glTF 2.0 (.gltf JSON or .glb): scene nodes, mesh primitives (triangles,
 * strips, fans, lines, points), base colours and vertex colours, and the
 * first animation as node tracks. External buffers come from `resources`. */
export function parseGltf(input: string | ArrayBuffer | Uint8Array, resources: Record<string, ArrayBuffer | Uint8Array | string> = {}): World {
  const world = emptyWorld()
  const parsed = gltfJson(toBytes(input))
  if (!parsed) return finishWorld(world)
  const { json, bin } = parsed
  const buffers: (Uint8Array | null)[] = ((json.buffers ?? []) as { uri?: string }[]).map((b, i) => {
    if (!b.uri) return i === 0 ? bin : null
    if (b.uri.startsWith("data:")) return base64Bytes(b.uri.slice(b.uri.indexOf(",") + 1))
    const r = resources[b.uri] ?? resources[decodeURIComponent(b.uri)]
    return r === undefined ? null : typeof r === "string" ? new TextEncoder().encode(r) : toBytes(r)
  })
  const accessor = (index: number | undefined): { data: number[]; comps: number; count: number } | null => {
    const acc = json.accessors?.[index as number]
    if (!acc || acc.bufferView === undefined) return null
    const bv = json.bufferViews?.[acc.bufferView]
    const buf = bv && buffers[bv.buffer]
    if (!bv || !buf) return null
    const comps = GLTF_COMPONENTS[acc.type] ?? 1
    const size = GLTF_SIZE[acc.componentType] ?? 4
    const stride = bv.byteStride || comps * size
    const base = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
    const data: number[] = []
    const norm = !!acc.normalized
    for (let i = 0; i < acc.count; i++)
      for (let c = 0; c < comps; c++) {
        const o = base + i * stride + c * size
        if (o + size > buf.byteLength) return { data, comps, count: Math.floor(data.length / comps) }
        let v: number
        switch (acc.componentType) {
          case 5120:
            v = view.getInt8(o)
            if (norm) v = Math.max(-1, v / 127)
            break
          case 5121:
            v = view.getUint8(o)
            if (norm) v /= 255
            break
          case 5122:
            v = view.getInt16(o, true)
            if (norm) v = Math.max(-1, v / 32767)
            break
          case 5123:
            v = view.getUint16(o, true)
            if (norm) v /= 65535
            break
          case 5125:
            v = view.getUint32(o, true)
            break
          default:
            v = view.getFloat32(o, true)
        }
        data.push(v)
      }
    return { data, comps, count: acc.count }
  }

  // Which nodes the first animation drives (they, and nothing else, become world nodes).
  const anim = json.animations?.[0]
  const animated = new Set<number>()
  for (const ch of anim?.channels ?? []) if (typeof ch.target?.node === "number") animated.add(ch.target.node)
  const nodeIndex = new Map<number, number>()

  const nodeLocal = (n: GltfJson): Mat4 => {
    if (Array.isArray(n.matrix) && n.matrix.length === 16) return n.matrix.map(Number)
    const t: Vec3 = n.translation ? [n.translation[0], n.translation[1], n.translation[2]] : [0, 0, 0]
    const r: Quat = n.rotation ? quatNormalize([n.rotation[0], n.rotation[1], n.rotation[2], n.rotation[3]]) : QUAT_IDENTITY
    const s: Vec3 = n.scale ? [n.scale[0], n.scale[1], n.scale[2]] : [1, 1, 1]
    return composeTransform(t, r, s)
  }

  const primitive = (prim: GltfJson, m: Mat4, node: number) => {
    const pos = accessor(prim.attributes?.POSITION)
    if (!pos || pos.comps !== 3) return
    const idx = accessor(prim.indices)
    const order = idx ? idx.data : Array.from({ length: pos.count }, (_, i) => i)
    const mode = prim.mode ?? 4
    const faces: number[][] = []
    let kind: MeshKind = "faces"
    if (mode === 4) for (let i = 0; i + 2 < order.length; i += 3) faces.push([order[i], order[i + 1], order[i + 2]])
    else if (mode === 5) for (let i = 0; i + 2 < order.length; i++) faces.push(i % 2 ? [order[i + 1], order[i], order[i + 2]] : [order[i], order[i + 1], order[i + 2]])
    else if (mode === 6) for (let i = 1; i + 1 < order.length; i++) faces.push([order[0], order[i], order[i + 1]])
    else if (mode === 1) {
      kind = "lines"
      for (let i = 0; i + 1 < order.length; i += 2) faces.push([order[i], order[i + 1]])
    } else if (mode === 3 || mode === 2) {
      kind = "lines"
      faces.push(mode === 2 ? [...order, order[0]] : [...order])
    } else if (mode === 0) {
      kind = "points"
      faces.push([...order])
    } else return
    const material = json.materials?.[prim.material]
    const base = material?.pbrMetallicRoughness?.baseColorFactor
    const color: Rgb = Array.isArray(base) ? [base[0] * 255, base[1] * 255, base[2] * 255] : GREY
    const vc = kind === "faces" ? accessor(prim.attributes?.COLOR_0) : null
    const colors = vc && vc.comps >= 3 ? faces.flatMap((f) => average(vc.comps === 3 ? vc.data : stripAlpha(vc.data), f)) : undefined
    addMesh(world, { points: pos.data, faces, colors }, m, color, !material?.doubleSided, { kind, node })
  }

  const walk = (index: number, mRel: Mat4, parent: number, depth: number) => {
    const n = json.nodes?.[index]
    if (!n || depth > 64) return
    let m: Mat4
    let node = parent
    if (animated.has(index)) {
      const t: Vec3 = n.translation ? [n.translation[0], n.translation[1], n.translation[2]] : [0, 0, 0]
      const r: Quat = n.rotation ? quatNormalize([n.rotation[0], n.rotation[1], n.rotation[2], n.rotation[3]]) : QUAT_IDENTITY
      const s: Vec3 = n.scale ? [n.scale[0], n.scale[1], n.scale[2]] : [1, 1, 1]
      node = addNode(world, { parent, pre: Array.isArray(n.matrix) && n.matrix.length === 16 ? mat4Multiply(mRel, n.matrix.map(Number)) : mRel, translation: t, rotation: r, scale: s })
      nodeIndex.set(index, node)
      m = mat4Identity()
    } else m = mat4Multiply(mRel, nodeLocal(n))
    const mesh = json.meshes?.[n.mesh]
    for (const prim of mesh?.primitives ?? []) primitive(prim, m, node)
    for (const child of n.children ?? []) walk(child, m, node, depth + 1)
  }
  const scene = json.scenes?.[json.scene ?? 0]
  const roots: number[] = scene?.nodes ?? (json.nodes ?? []).map((_: unknown, i: number) => i).filter((i: number) => !(json.nodes ?? []).some((n: GltfJson) => n.children?.includes(i)))
  for (const r of roots) walk(r, mat4Identity(), -1, 0)

  if (anim) {
    let duration = 0
    const samplers = (anim.samplers ?? []).map((s: GltfJson) => {
      const input = accessor(s.input)
      const output = accessor(s.output)
      if (input) for (const k of input.data) duration = Math.max(duration, k)
      return { input, output, interpolation: s.interpolation ?? "LINEAR" }
    })
    for (const ch of anim.channels ?? []) {
      const target = nodeIndex.get(ch.target?.node)
      const s = samplers[ch.sampler]
      const path = String(ch.target?.path) as "translation" | "rotation" | "scale"
      if (target === undefined || !s?.input || !s.output || (path !== "translation" && path !== "rotation" && path !== "scale")) continue
      const stride = path === "rotation" ? 4 : 3
      const cubic = s.interpolation === "CUBICSPLINE"
      const value: number[] = []
      for (let k = 0; k < s.input.count; k++) {
        const o = cubic ? (k * 3 + 1) * stride : k * stride
        for (let c = 0; c < stride; c++) value.push(s.output.data[o + c] ?? 0)
      }
      const track: Track = { key: s.input.data.slice(0, s.input.count), value, stride, kind: path === "rotation" ? "slerp" : s.interpolation === "STEP" ? "step" : "lerp", duration, loop: true, start: 0 }
      world.nodes[target].tracks[path] = track
    }
  }
  return finishWorld(world)
}

const stripAlpha = (rgba: number[]): number[] => {
  const out: number[] = []
  for (let i = 0; i + 3 < rgba.length; i += 4) out.push(rgba[i], rgba[i + 1], rgba[i + 2])
  return out
}

// ---- VRML: tokens → generic nodes --------------------------------------------

export type VrmlNode = { type: string; name?: string; fields: Record<string, VrmlValue> }
export type VrmlValue = number[] | string[] | boolean | VrmlNode[]
export type VrmlRoute = { from: string; fromField: string; to: string; toField: string }

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
 * graph (Separator state machine), everything else reads as VRML97 / X3D.
 * ROUTE statements come back separately for the animation builder. */
export function parseVrmlNodes(text: string): { version: 1 | 2; nodes: VrmlNode[]; routes: VrmlRoute[] } {
  const version = /^\s*#VRML\s+V1\.0/i.test(text) ? 1 : 2
  const toks = tokenizeVrml(text)
  const defs = new Map<string, VrmlNode>()
  const routes: VrmlRoute[] = []
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
      if (node && name !== undefined) {
        node.name = name
        defs.set(name, node)
      }
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
      const [from, fromField] = (toks[i] ?? "").split(".")
      const [to, toField] = (toks[i + 2] ?? "").split(".")
      if (from && fromField && to && toField) routes.push({ from, fromField, to, toField })
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
  return { version, nodes, routes }
}

// ---- X3D XML → the same nodes -------------------------------------------------------

type XmlEl = { name: string; attrs: Record<string, string>; children: XmlEl[] }

const XML_ENTITIES: Record<string, string> = { quot: '"', amp: "&", lt: "<", gt: ">", apos: "'" }
const unescapeXml = (s: string) => s.replace(/&(quot|amp|lt|gt|apos|#x[0-9a-fA-F]+|#\d+);/g, (_, e: string) => (e[0] === "#" ? String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : XML_ENTITIES[e]))

/** A small XML reader: elements and attributes, no text, no namespaces. */
export function parseXml(text: string): XmlEl {
  const root: XmlEl = { name: "", attrs: {}, children: [] }
  const stack: XmlEl[] = [root]
  const n = text.length
  let i = 0
  while (i < n) {
    const lt = text.indexOf("<", i)
    if (lt < 0) break
    if (text.startsWith("<!--", lt)) {
      const end = text.indexOf("-->", lt + 4)
      i = end < 0 ? n : end + 3
      continue
    }
    if (text.startsWith("<![CDATA[", lt)) {
      const end = text.indexOf("]]>", lt + 9)
      i = end < 0 ? n : end + 3
      continue
    }
    if (text.startsWith("<?", lt)) {
      const end = text.indexOf("?>", lt + 2)
      i = end < 0 ? n : end + 2
      continue
    }
    if (text.startsWith("<!", lt)) {
      // DOCTYPE, possibly with an internal subset in brackets.
      let depth = 0
      let j = lt
      for (; j < n; j++) {
        if (text[j] === "[") depth++
        else if (text[j] === "]") depth--
        else if (text[j] === ">" && depth <= 0) break
      }
      i = j + 1
      continue
    }
    const close = text[lt + 1] === "/"
    let j = lt + (close ? 2 : 1)
    let name = ""
    while (j < n && !/[\s/>]/.test(text[j])) name += text[j++]
    const attrs: Record<string, string> = {}
    let selfClosing = false
    while (j < n && text[j] !== ">") {
      if (text[j] === "/") {
        selfClosing = true
        j++
        continue
      }
      if (/\s/.test(text[j])) {
        j++
        continue
      }
      let key = ""
      while (j < n && !/[\s=/>]/.test(text[j])) key += text[j++]
      while (j < n && /\s/.test(text[j])) j++
      if (text[j] === "=") {
        j++
        while (j < n && /\s/.test(text[j])) j++
        const q = text[j]
        if (q === '"' || q === "'") {
          const end = text.indexOf(q, j + 1)
          attrs[key] = unescapeXml(text.slice(j + 1, end < 0 ? n : end))
          j = end < 0 ? n : end + 1
        } else {
          let v = ""
          while (j < n && !/[\s/>]/.test(text[j])) v += text[j++]
          attrs[key] = unescapeXml(v)
        }
      } else if (key) attrs[key] = ""
    }
    i = j + 1
    if (close) {
      if (stack.length > 1) stack.pop()
      continue
    }
    const el: XmlEl = { name, attrs, children: [] }
    stack[stack.length - 1].children.push(el)
    if (!selfClosing) stack.push(el)
  }
  return root
}

/** Default containerField of an X3D child by its node type. */
const X3D_CONTAINER: Record<string, string> = {
  Appearance: "appearance",
  Material: "material",
  Coordinate: "coord",
  Color: "color",
  ColorRGBA: "color",
  Normal: "normal",
  Box: "geometry",
  Sphere: "geometry",
  Cone: "geometry",
  Cylinder: "geometry",
  IndexedFaceSet: "geometry",
  IndexedLineSet: "geometry",
  PointSet: "geometry",
  ElevationGrid: "geometry",
  IndexedTriangleSet: "geometry",
  TriangleSet: "geometry",
}

function x3dValue(raw: string): VrmlValue {
  const s = raw.trim()
  if (s === "true" || s === "TRUE") return true
  if (s === "false" || s === "FALSE") return false
  if (s.includes('"')) return [...s.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1])
  const parts = s.split(/[\s,]+/).filter(Boolean)
  if (parts.length && parts.every((p) => isNumber(p))) return parts.map(Number)
  return [s]
}

function x3dNodes(el: XmlEl, defs: Map<string, VrmlNode>, routes: VrmlRoute[]): VrmlNode[] {
  const out: VrmlNode[] = []
  for (const child of el.children) {
    if (child.name === "ROUTE") {
      const a = child.attrs
      if (a.fromNode && a.fromField && a.toNode && a.toField) routes.push({ from: a.fromNode, fromField: a.fromField, to: a.toNode, toField: a.toField })
      continue
    }
    if (child.name === "X3D" || child.name === "Scene") {
      out.push(...x3dNodes(child, defs, routes))
      continue
    }
    if (child.name === "head" || child.name === "meta" || child.name === "component" || child.name === "unit") continue
    if (child.attrs.USE) {
      const used = defs.get(child.attrs.USE)
      if (used) out.push(used)
      continue
    }
    const node: VrmlNode = { type: child.name, fields: {} }
    for (const [k, v] of Object.entries(child.attrs)) {
      if (k === "DEF") {
        node.name = v
        defs.set(v, node)
      } else if (k !== "USE" && k !== "containerField" && k !== "class" && k !== "id") node.fields[k] = x3dValue(v)
    }
    for (const sub of child.children) {
      if (sub.name === "ROUTE") {
        const a = sub.attrs
        if (a.fromNode && a.fromField && a.toNode && a.toField) routes.push({ from: a.fromNode, fromField: a.fromField, to: a.toNode, toField: a.toField })
        continue
      }
      const kids = x3dNodes({ name: "", attrs: {}, children: [sub] }, defs, routes)
      if (!kids.length) continue
      const field = sub.attrs.containerField || X3D_CONTAINER[sub.name] || "children"
      const existing = node.fields[field]
      node.fields[field] = [...(Array.isArray(existing) && typeof existing[0] === "object" ? (existing as VrmlNode[]) : []), ...kids]
    }
    out.push(node)
  }
  return out
}

/** X3D XML encoding → World (the same scene builder as VRML97). */
export function parseX3d(text: string): World {
  const routes: VrmlRoute[] = []
  const nodes = x3dNodes(parseXml(text), new Map(), routes)
  const world = emptyWorld()
  buildV2(nodes, routes, world)
  return finishWorld(world)
}

// ---- VRML: nodes → world ------------------------------------------------------------

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
const rgbOf = (v: number[], def: Rgb = GREY): Rgb => (v.length >= 3 ? [v[0] * 255, v[1] * 255, v[2] * 255] : def)
const axisAngle = (r: number[]): Quat => quatFromAxisAngle([r[0] ?? 0, r[1] ?? 0, r[2] ?? 1], r[3] ?? 0)

/** VRML's Transform: T · C · R · SR · S · -SR · -C from axis-angle fields. */
export const vrmlTransform = (translation: Vec3, rotation: number[], scale: Vec3, scaleOrientation: number[], center: Vec3): Mat4 =>
  composeTransform(translation, axisAngle(rotation), scale, center, axisAngle(scaleOrientation))

const transformOf = (n: VrmlNode, scaleKey: string) =>
  vrmlTransform(vec(nums(n, "translation", []), [0, 0, 0]), nums(n, "rotation", [0, 0, 1, 0]), vec(nums(n, scaleKey, []), [1, 1, 1]), nums(n, "scaleOrientation", [0, 0, 1, 0]), vec(nums(n, "center", []), [0, 0, 0]))

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
      return { geo: boxGeometry([nums(g, "width", [2])[0], nums(g, "height", [2])[0], nums(g, "depth", [2])[0]]), solid: true, ccw: true, kind: "faces" }
    case "Sphere":
      return { geo: sphereGeometry(nums(g, "radius", [1])[0]), solid: true, ccw: true, kind: "faces" }
    case "Cone":
      return { geo: coneGeometry(nums(g, "bottomRadius", [1])[0], nums(g, "height", [2])[0], flag(g, "side", true), flag(g, "bottom", true)), solid: true, ccw: true, kind: "faces" }
    case "Cylinder":
      return { geo: cylinderGeometry(nums(g, "radius", [1])[0], nums(g, "height", [2])[0], flag(g, "side", true), flag(g, "top", true), flag(g, "bottom", true)), solid: true, ccw: true, kind: "faces" }
    case "IndexedFaceSet":
    case "IndexedTriangleSet": {
      const coord = children(g, "coord")[0]
      const pts = points ?? (coord ? nums(coord, "point", []) : [])
      const faces = g.type === "IndexedTriangleSet" ? triplesOf(nums(g, "index", [])) : facesOf(nums(g, "coordIndex", []))
      return { geo: { points: pts, faces, colors: faceColors(g, faces) }, solid: flag(g, "solid", true), ccw: flag(g, "ccw", true), kind: "faces" }
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
        geo: elevationGeometry(nums(g, "xDimension", [0])[0], nums(g, "zDimension", [0])[0], nums(g, "xSpacing", [1])[0], nums(g, "zSpacing", [1])[0], nums(g, "height", [])),
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

/** The Material colour for a shape: diffuse for faces, emissive (when lit) for lines and points. */
function materialColor(shape: VrmlNode, kind: MeshKind): Rgb {
  const material = children(children(shape, "appearance")[0] ?? shape, "material")[0]
  if (!material) return GREY
  const diffuse = rgbOf(nums(material, "diffuseColor", []), [204, 204, 204])
  if (kind === "faces") return diffuse
  const emissive = nums(material, "emissiveColor", [])
  return emissive.length >= 3 && emissive[0] + emissive[1] + emissive[2] > 0 ? rgbOf(emissive) : diffuse
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
function tracksFor(name: string, routes: VrmlRoute[], byName: Map<string, VrmlNode>): { translation?: Track; rotation?: Track; scale?: Track } {
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

function buildV2(nodes: VrmlNode[], routes: VrmlRoute[], world: World): void {
  const byName = new Map<string, VrmlNode>()
  const index = (list: VrmlNode[], depth: number) => {
    for (const n of list) {
      if (n.name) byName.set(n.name, n)
      if (depth < 64) for (const v of Object.values(n.fields)) if (Array.isArray(v) && typeof v[0] === "object") index(v as VrmlNode[], depth + 1)
    }
  }
  index(nodes, 0)
  const animatedNames = new Set(routes.map((r) => r.to).filter((name) => NODE_FIELDS[routes.find((r) => r.to === name)?.toField ?? ""]))

  const walk = (list: VrmlNode[], m: Mat4, parent: number, depth: number) => {
    if (depth > 64) return
    for (const n of list) {
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
          if (built) addMesh(world, built.geo, m, materialColor(n, built.kind), built.solid, { ccw: built.ccw, kind: built.kind, node: parent })
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
          walk(children(n, "children"), m, parent, depth + 1)
      }
    }
  }
  walk(nodes, mat4Identity(), -1, 0)
}

type V1State = { m: Mat4; points: number[]; color: Rgb; ccw: boolean | null; solid: boolean }

function buildV1(nodes: VrmlNode[], world: World): void {
  const walk = (list: VrmlNode[], s: V1State, depth: number) => {
    if (depth > 64) return
    for (const n of list) {
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
          const built = geometryOf(n, n.type === "IndexedFaceSet" || n.type === "IndexedLineSet" || n.type === "PointSet" ? s.points : null)
          if (built) addMesh(world, built.geo, s.m, s.color, faceSet ? s.ccw !== null && s.solid : built.solid, { ccw: faceSet ? s.ccw !== false : true, kind: built.kind })
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
