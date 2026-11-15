// glTF 2.0: `.gltf` JSON with data: URIs or pre-fetched buffers, and `.glb`
// (`../models.ts`).

import {
  composeTransform,
  mat4Identity,
  mat4Multiply,
  QUAT_IDENTITY,
  quatNormalize,
  type Mat4,
  type Quat,
  type Vec3,
} from "../world-math"
import { addMesh, addNode, emptyWorld, finishWorld, type MeshKind, type Track, type World } from "../world-scene"
import type { Rgb } from "../palette"
import { average, decode, GREY, MAX_NODES, toBytes } from "./shared"

type GltfJson = Record<string, any>

export function gltfJson(bytes: Uint8Array): { json: GltfJson; bin: Uint8Array | null } | null {
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
export function parseGltf(
  input: string | ArrayBuffer | Uint8Array,
  resources: Record<string, ArrayBuffer | Uint8Array | string> = {},
): World {
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
    const r: Quat = n.rotation
      ? quatNormalize([n.rotation[0], n.rotation[1], n.rotation[2], n.rotation[3]])
      : QUAT_IDENTITY
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
    else if (mode === 5)
      for (let i = 0; i + 2 < order.length; i++)
        faces.push(i % 2 ? [order[i + 1], order[i], order[i + 2]] : [order[i], order[i + 1], order[i + 2]])
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
    const colors =
      vc && vc.comps >= 3 ? faces.flatMap((f) => average(vc.comps === 3 ? vc.data : stripAlpha(vc.data), f)) : undefined
    // glTF's uv origin is the texture's top-left, like the kit's.
    const tc = kind === "faces" ? accessor(prim.attributes?.TEXCOORD_0) : null
    addMesh(
      world,
      { points: pos.data, faces, colors, uvs: tc && tc.comps === 2 ? tc.data : undefined },
      m,
      color,
      !material?.doubleSided,
      { kind, node },
    )
  }

  let visits = 0
  const walk = (index: number, mRel: Mat4, parent: number, depth: number) => {
    const n = json.nodes?.[index]
    if (!n || depth > 64 || ++visits > MAX_NODES) return
    let m: Mat4
    let node = parent
    if (animated.has(index)) {
      const t: Vec3 = n.translation ? [n.translation[0], n.translation[1], n.translation[2]] : [0, 0, 0]
      const r: Quat = n.rotation
        ? quatNormalize([n.rotation[0], n.rotation[1], n.rotation[2], n.rotation[3]])
        : QUAT_IDENTITY
      const s: Vec3 = n.scale ? [n.scale[0], n.scale[1], n.scale[2]] : [1, 1, 1]
      node = addNode(world, {
        parent,
        pre: Array.isArray(n.matrix) && n.matrix.length === 16 ? mat4Multiply(mRel, n.matrix.map(Number)) : mRel,
        translation: t,
        rotation: r,
        scale: s,
      })
      nodeIndex.set(index, node)
      m = mat4Identity()
    } else m = mat4Multiply(mRel, nodeLocal(n))
    const mesh = json.meshes?.[n.mesh]
    for (const prim of mesh?.primitives ?? []) primitive(prim, m, node)
    for (const child of n.children ?? []) walk(child, m, node, depth + 1)
  }
  const scene = json.scenes?.[json.scene ?? 0]
  const roots: number[] =
    scene?.nodes ??
    (json.nodes ?? [])
      .map((_: unknown, i: number) => i)
      .filter((i: number) => !(json.nodes ?? []).some((n: GltfJson) => n.children?.includes(i)))
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
      if (
        target === undefined ||
        !s?.input ||
        !s.output ||
        (path !== "translation" && path !== "rotation" && path !== "scale")
      )
        continue
      const stride = path === "rotation" ? 4 : 3
      const cubic = s.interpolation === "CUBICSPLINE"
      const value: number[] = []
      for (let k = 0; k < s.input.count; k++) {
        const o = cubic ? (k * 3 + 1) * stride : k * stride
        for (let c = 0; c < stride; c++) value.push(s.output.data[o + c] ?? 0)
      }
      const track: Track = {
        key: s.input.data.slice(0, s.input.count),
        value,
        stride,
        kind: path === "rotation" ? "slerp" : s.interpolation === "STEP" ? "step" : "lerp",
        duration,
        loop: true,
        start: 0,
      }
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
