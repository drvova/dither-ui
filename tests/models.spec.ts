import { describe, expect, it } from "vitest"
import { externalResources, formatOf, parseGltf, parseMtl, parseObj, parseOff, parsePly, parseWorld, parseX3d, parseXml, sniffFormat } from "../dither-kit/models"
import { nodeMatrices, transformPoint } from "../dither-kit/world"

const enc = (s: string) => new TextEncoder().encode(s)

/** A GLB holding one triangle (+ optional colour, node transform, animation). */
function glb(opts: { color?: boolean; rotate?: boolean; animate?: boolean; strip?: boolean } = {}): Uint8Array {
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0])
  const colors = new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0])
  const indices = new Uint16Array([0, 1, 2, 0])
  const times = new Float32Array([0, 1])
  const quats = new Float32Array([0, 0, 0, 1, 0, 0, Math.SQRT1_2, Math.SQRT1_2])
  const parts = [positions, colors, indices, times, quats].map((a) => new Uint8Array(a.buffer))
  const total = parts.reduce((n, p) => n + Math.ceil(p.length / 4) * 4, 0)
  const bin = new Uint8Array(total)
  const views: { buffer: number; byteOffset: number; byteLength: number }[] = []
  let o = 0
  for (const p of parts) {
    bin.set(p, o)
    views.push({ buffer: 0, byteOffset: o, byteLength: p.length })
    o += Math.ceil(p.length / 4) * 4
  }
  const json = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, ...(opts.rotate ? { rotation: [0, 0, Math.SQRT1_2, Math.SQRT1_2] } : {}) }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, ...(opts.color ? { COLOR_0: 1 } : {}) }, indices: 2, material: 0, ...(opts.strip ? { mode: 5 } : {}) }] }],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: [0, 1, 0, 1] }, doubleSided: true }],
    buffers: [{ byteLength: total }],
    bufferViews: views,
    accessors: [
      { bufferView: 0, componentType: 5126, count: 4, type: "VEC3" },
      { bufferView: 1, componentType: 5126, count: 4, type: "VEC3" },
      { bufferView: 2, componentType: 5123, count: opts.strip ? 4 : 3, type: "SCALAR" },
      { bufferView: 3, componentType: 5126, count: 2, type: "SCALAR" },
      { bufferView: 4, componentType: 5126, count: 2, type: "VEC4" },
    ],
    ...(opts.animate ? { animations: [{ channels: [{ sampler: 0, target: { node: 0, path: "rotation" } }], samplers: [{ input: 3, output: 4, interpolation: "LINEAR" }] }] } : {}),
  }
  const jsonBytes = enc(JSON.stringify(json))
  const jsonPad = Math.ceil(jsonBytes.length / 4) * 4
  const out = new Uint8Array(12 + 8 + jsonPad + 8 + total)
  const dv = new DataView(out.buffer)
  out.set([0x67, 0x6c, 0x54, 0x46], 0)
  dv.setUint32(4, 2, true)
  dv.setUint32(8, out.length, true)
  dv.setUint32(12, jsonPad, true)
  dv.setUint32(16, 0x4e4f534a, true)
  out.set(jsonBytes, 20)
  for (let i = 20 + jsonBytes.length; i < 20 + jsonPad; i++) out[i] = 0x20
  dv.setUint32(20 + jsonPad, total, true)
  dv.setUint32(24 + jsonPad, 0x004e4942, true)
  out.set(bin, 28 + jsonPad)
  return out
}

describe("formats", () => {
  it("names and sniffs every format", () => {
    expect(["a.x3d", "b.glb", "c.gltf", "d.ply", "e.off", "f.x3dv"].map(formatOf)).toEqual(["x3d", "gltf", "gltf", "ply", "off", "vrml"])
    expect(sniffFormat(glb())).toBe("gltf")
    expect(sniffFormat(enc('{ "asset": { "version": "2.0" } }'))).toBe("gltf")
    expect(sniffFormat(enc('<?xml version="1.0"?><X3D></X3D>'))).toBe("x3d")
    expect(sniffFormat(enc("ply\nformat ascii 1.0\n"))).toBe("ply")
    expect(sniffFormat(enc("OFF\n3 1 0\n"))).toBe("off")
  })
  it("lists the external files a model needs", () => {
    expect(externalResources("mtllib a.mtl b.mtl\nv 0 0 0\n", "obj")).toEqual(["a.mtl", "b.mtl"])
    expect(externalResources('{ "asset": {}, "buffers": [{ "uri": "scene.bin", "byteLength": 1 }, { "uri": "data:application/octet-stream;base64,AA==", "byteLength": 1 }] }', "gltf")).toEqual(["scene.bin"])
    expect(externalResources("#VRML V2.0 utf8\n", "vrml")).toEqual([])
  })
})

describe("glTF", () => {
  it("reads GLB primitives, materials, vertex colours and node transforms", () => {
    const w = parseGltf(glb({ color: true, rotate: true }))
    expect(w.meshes.length).toBe(1)
    const m = w.meshes[0]
    expect(m.indices.length).toBe(3)
    expect(m.solid).toBe(false)
    expect(w.palette[m.color]).toEqual([0, 255, 0])
    expect(w.palette[m.triColors![0]]).toEqual([255, 0, 0])
    // rotated 90° about z: (1, 0, 0) → (0, 1, 0)
    expect(m.positions[3]).toBeCloseTo(0, 5)
    expect(m.positions[4]).toBeCloseTo(1, 5)
    expect(parseGltf(glb({ strip: true })).meshes[0].indices.length).toBe(6)
  })
  it("plays the first animation as node tracks", () => {
    const w = parseWorld(glb({ animate: true }), "auto")
    expect(w.nodes.length).toBe(1)
    expect(w.meshes[0].node).toBe(0)
    expect(w.nodes[0].tracks.rotation?.kind).toBe("slerp")
    expect(w.duration).toBe(1)
    // Halfway through the loop: 45° about z. (t = duration wraps to 0.)
    const p = transformPoint(nodeMatrices(w, 0.5)[0], [1, 0, 0])
    expect(p[0]).toBeCloseTo(Math.SQRT1_2, 4)
    expect(p[1]).toBeCloseTo(Math.SQRT1_2, 4)
    expect(transformPoint(nodeMatrices(w, 1)[0], [1, 0, 0])[0]).toBeCloseTo(1, 4)
  })
  it("reads .gltf JSON with data: URIs and pre-fetched buffers", () => {
    const pos = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])
    const b64 = btoa(String.fromCharCode(...new Uint8Array(pos.buffer)))
    const json = (uri: string) => JSON.stringify({ asset: { version: "2.0" }, nodes: [{ mesh: 0 }], meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }], buffers: [{ uri, byteLength: 36 }], bufferViews: [{ buffer: 0, byteLength: 36 }], accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3" }] })
    expect(parseWorld(json(`data:application/octet-stream;base64,${b64}`), "gltf").meshes[0].indices.length).toBe(3)
    expect(parseWorld(json("tri.bin"), "gltf", { resources: { "tri.bin": pos.buffer } }).meshes[0].indices.length).toBe(3)
    expect(parseWorld(json("missing.bin"), "gltf").meshes.length).toBe(0)
  })
})

describe("PLY + OFF", () => {
  it("reads ASCII PLY with vertex colours and binary PLY with face colours", () => {
    const ascii = "ply\nformat ascii 1.0\nelement vertex 3\nproperty float x\nproperty float y\nproperty float z\nproperty uchar red\nproperty uchar green\nproperty uchar blue\nelement face 1\nproperty list uchar int vertex_indices\nend_header\n0 0 0 255 0 0\n1 0 0 255 0 0\n0 1 0 255 0 0\n3 0 1 2\n"
    const a = parsePly(ascii)
    expect(a.meshes[0].indices.length).toBe(3)
    expect(a.palette[a.meshes[0].triColors![0]]).toEqual([255, 0, 0])
    const header = "ply\nformat binary_little_endian 1.0\nelement vertex 3\nproperty float x\nproperty float y\nproperty float z\nelement face 1\nproperty list uchar uint vertex_indices\nproperty uchar red\nproperty uchar green\nproperty uchar blue\nend_header\n"
    const body = new Uint8Array(36 + 1 + 12 + 3)
    const dv = new DataView(body.buffer)
    ;[0, 0, 0, 2, 0, 0, 0, 2, 0].forEach((v, i) => dv.setFloat32(i * 4, v, true))
    body[36] = 3
    dv.setUint32(37, 0, true)
    dv.setUint32(41, 1, true)
    dv.setUint32(45, 2, true)
    body.set([0, 0, 255], 49)
    const bytes = new Uint8Array(enc(header).length + body.length)
    bytes.set(enc(header), 0)
    bytes.set(body, enc(header).length)
    const b = parseWorld(bytes, "auto")
    expect(b.meshes[0].indices.length).toBe(3)
    expect(b.palette[b.meshes[0].triColors![0]]).toEqual([0, 0, 255])
    expect(b.radius).toBeCloseTo(Math.SQRT2)
    const cloud = parsePly("ply\nformat ascii 1.0\nelement vertex 2\nproperty float x\nproperty float y\nproperty float z\nend_header\n0 0 0\n1 1 1\n")
    expect(cloud.meshes[0].kind).toBe("points")
  })
  it("reads OFF with optional face colours", () => {
    const w = parseOff("OFF\n4 2 0\n0 0 0\n1 0 0\n1 1 0\n0 1 0\n3 0 1 2 255 0 0\n3 0 2 3 0 0 255\n")
    expect(w.meshes[0].indices.length).toBe(6)
    expect(w.palette[w.meshes[0].triColors![0]]).toEqual([255, 0, 0])
    expect(w.palette[w.meshes[0].triColors![1]]).toEqual([0, 0, 255])
    const plain = parseOff("OFF\n# comment\n3 1 0\n0 0 0\n1 0 0\n0 1 0\n3 0 1 2\n")
    expect(plain.meshes[0].indices.length).toBe(3)
    expect(plain.meshes[0].triColors).toBeNull()
  })
})

describe("OBJ + MTL", () => {
  it("colours usemtl groups from the material library and keeps lines and points", () => {
    const mtl = "newmtl red\nKd 1 0 0\nnewmtl blue\nKd 0 0 1\n"
    expect(parseMtl(mtl)).toEqual({ red: [255, 0, 0], blue: [0, 0, 255] })
    const obj = "mtllib m.mtl\nv 0 0 0\nv 1 0 0\nv 1 1 0\nv 0 1 0\nusemtl red\nf 1 2 3\nusemtl blue\nf 1 3 4\nl 1 2 3\np 4\n"
    const w = parseWorld(obj, "obj", { resources: { "m.mtl": mtl } })
    expect(w.meshes.map((m) => [m.kind, w.palette[m.color]])).toEqual([["faces", [255, 0, 0]], ["faces", [0, 0, 255]], ["lines", [0, 0, 255]], ["points", [0, 0, 255]]])
    const bare = parseObj("v 0 0 0 1 0 0\nv 1 0 0 1 0 0\nv 0 1 0 1 0 0\nf 1 2 3\n")
    expect(bare.palette[bare.meshes[0].triColors![0]]).toEqual([255, 0, 0])
  })
})

describe("X3D XML", () => {
  it("reads elements into the VRML scene builder, with DEF/USE and ROUTEs", () => {
    const root = parseXml('<?xml version="1.0"?><!DOCTYPE X3D PUBLIC "x" "y"><X3D><head><meta name="a" content="b"/></head><Scene><Transform DEF="T" translation="2 0 0"><Shape><Appearance><Material diffuseColor="1 0 0"/></Appearance><Box size="2 2 2"/></Shape></Transform></Scene></X3D>')
    expect(root.children[0].name).toBe("X3D")
    expect(root.children[0].children[1].children[0].attrs).toEqual({ DEF: "T", translation: "2 0 0" })
    const w = parseX3d(`<X3D><Scene>
      <Transform DEF="T" translation="2 0 0"><Shape><Appearance><Material diffuseColor="1 0 0"/></Appearance><Box size="2 2 2"/></Shape></Transform>
      <Transform translation="-5 0 0"><Shape USE="S"/><Shape DEF="S"><Sphere radius="1"/></Shape></Transform>
      <TimeSensor DEF="Clock" cycleInterval="3" loop="true"/>
      <PositionInterpolator DEF="Move" key="0 1" keyValue="0 0 0, 0 4 0"/>
      <ROUTE fromNode="Clock" fromField="fraction_changed" toNode="Move" toField="set_fraction"/>
      <ROUTE fromNode="Move" fromField="value_changed" toNode="T" toField="set_translation"/>
    </Scene></X3D>`)
    expect(w.meshes.length).toBe(2)
    expect(w.palette[w.meshes[0].color]).toEqual([255, 0, 0])
    expect(w.nodes.length).toBe(1)
    expect(w.nodes[0].tracks.translation?.duration).toBe(3)
    expect(w.meshes[0].node).toBe(0)
    // set_translation replaces the field: halfway up the 0 → 4 run.
    const p = transformPoint(nodeMatrices(w, 1.5)[0], [0, 0, 0])
    expect(p[0]).toBeCloseTo(0)
    expect(p[1]).toBeCloseTo(2)
    expect(parseWorld('<X3D><Scene><Shape><Box/></Shape></Scene></X3D>', "auto").meshes.length).toBe(1)
  })
})
