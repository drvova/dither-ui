// Model files for the dither engine, parsed into a `World` (world.ts):
// VRML97 / X3D classic and VRML 1.0 (.wrl), X3D XML (.x3d), glTF 2.0 (.gltf
// with data: URIs or pre-fetched buffers, .glb), Wavefront OBJ (+ MTL
// colours), STL (ASCII + binary), PLY (ASCII + binary; a trained capture's
// Gaussians become splats), the `.splat` capture and OFF. Lenient by
// design — unknown nodes are walked for children and otherwise ignored, bad
// indices are dropped, nothing throws on a file that is merely odd. Bounded
// too: a file's counts are held to the data it carries and a scene graph is
// walked for at most MAX_NODES nodes, so a small hostile file (a DEF/USE
// fan-out, a list that claims a billion entries) cannot hang the page. Files
// that animate (VRML TimeSensor → interpolator → ROUTE, glTF animations)
// become tracks on world nodes, sampled by the renderer at the kit clock.
//
// This file is the entry: a format's name, its sniffing, the files it needs
// and `parseWorld`. Each format is a file of `models/` (what they share in
// `models/shared.ts`), handed on here under the names it always had.

import { mat4Multiply, mat4Rotate, type Vec3 } from "./world-math"
import { finishWorld, type World } from "./world-scene"
import type { Rgb } from "./palette"
import { parseSplat, rotateCloud } from "./splats"
import { decode, splatWorld, toBytes } from "./models/shared"
import { parseMtl, parseObj } from "./models/obj"
import { isBinaryStl, parseStl } from "./models/stl"
import { parsePly } from "./models/ply"
import { parseOff } from "./models/off"
import { gltfJson, parseGltf } from "./models/gltf"
import { parseX3d } from "./models/x3d"
import { parseVrml } from "./models/vrml"

export { MAX_NODES, splatWorld } from "./models/shared"
export { parseMtl, parseObj } from "./models/obj"
export { parseStl } from "./models/stl"
export { parsePly } from "./models/ply"
export { parseOff } from "./models/off"
export { parseGltf } from "./models/gltf"
export { parseVrmlNodes, tokenizeVrml, type VrmlNode, type VrmlRoute, type VrmlValue } from "./models/vrml-grammar"
export { parseX3d, parseXml } from "./models/x3d"
export { facesOf, parseVrml, vrmlTransform } from "./models/vrml"

/** Every format the kit reads (VRML covers 97 and 1.0, glTF covers GLB). */
export const MODEL_FORMATS = ["vrml", "x3d", "obj", "stl", "ply", "off", "gltf", "splat"] as const
export type ModelFormat = (typeof MODEL_FORMATS)[number]

/** Format from a file name or URL (query/hash ignored), null when unknown. */
export function formatOf(name: string): ModelFormat | null {
  const ext = name
    .split(/[?#]/)[0]
    .toLowerCase()
    .match(/\.([a-z0-9]+)$/)?.[1]
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
    case "splat":
      return "splat"
    default:
      return null
  }
}

/** Sniff a format from the bytes when the name gives none. */
export function sniffFormat(bytes: Uint8Array): ModelFormat {
  if (bytes.length >= 12 && bytes[0] === 0x67 && bytes[1] === 0x6c && bytes[2] === 0x54 && bytes[3] === 0x46)
    return "gltf"
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
  /** "z" swings a z-up file (CAD / printing STLs) to y-up, the default for
   * STL; "-y" turns a y-down file (a capture's camera space) upright, the
   * default for splats. */
  up?: "y" | "z" | "-y"
  /** Files the model references by relative URI (glTF buffers, OBJ .mtl), pre-fetched by the caller. */
  resources?: Record<string, ArrayBuffer | Uint8Array | string>
}

/** Relative URIs a file needs before it can be parsed completely (glTF
 * buffers without a data: URI, an OBJ's mtllib). */
export function externalResources(
  input: string | ArrayBuffer | Uint8Array,
  format: ModelFormat | "auto" = "auto",
): string[] {
  const bytes = toBytes(input)
  const fmt = format === "auto" ? sniffFormat(bytes) : format
  if (fmt === "obj") {
    const text = typeof input === "string" ? input : decode(bytes)
    return [...text.matchAll(/^\s*mtllib\s+(.+?)\s*$/gm)].flatMap((m) => m[1].split(/\s+/))
  }
  if (fmt === "gltf") {
    const json = gltfJson(bytes)?.json
    const out: string[] = []
    for (const b of (json?.buffers ?? []) as { uri?: string }[])
      if (b.uri && !b.uri.startsWith("data:")) out.push(b.uri)
    return out
  }
  return []
}

/** Parse any supported model into a World. `format` "auto" sniffs the bytes. */
export function parseWorld(
  input: string | ArrayBuffer | Uint8Array,
  format: ModelFormat | "auto" = "auto",
  opts: ParseOptions = {},
): World {
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
              : fmt === "splat"
                ? splatWorld(parseSplat(bytes))
                : fmt === "x3d"
                  ? parseX3d(text())
                  : parseVrml(text())
  const up = opts.up ?? (fmt === "stl" ? "z" : world.splats ? "-y" : "y")
  if (up !== "y") {
    // a turn about x: a quarter for z-up, a half for y-down
    const swing = mat4Rotate([1, 0, 0], up === "z" ? -Math.PI / 2 : Math.PI)
    const turn = ([x, y, z]: Vec3): Vec3 => (up === "z" ? [x, z, -y] : [x, -y, -z])
    for (const m of world.meshes)
      if (m.node < 0)
        for (let i = 0; i < m.positions.length; i += 3) {
          const [x, y, z] = turn([m.positions[i], m.positions[i + 1], m.positions[i + 2]])
          m.positions[i] = x
          m.positions[i + 1] = y
          m.positions[i + 2] = z
        }
    for (const n of world.nodes) if (n.parent < 0) n.pre = mat4Multiply(swing, n.pre)
    for (const l of world.lights) l.direction = turn(l.direction)
    if (world.viewpoint) world.viewpoint.position = turn(world.viewpoint.position)
    if (world.splats)
      rotateCloud(world.splats, up === "z" ? [1, 0, 0, 0, 0, 1, 0, -1, 0] : [1, 0, 0, 0, -1, 0, 0, 0, -1])
    finishWorld(world)
  }
  return world
}

function objMaterials(res: Record<string, ArrayBuffer | Uint8Array | string>, obj: string): Record<string, Rgb> {
  let out: Record<string, Rgb> = {}
  for (const uri of externalResources(obj, "obj")) {
    const r = res[uri]
    if (r !== undefined) out = { ...out, ...parseMtl(typeof r === "string" ? r : decode(toBytes(r))) }
  }
  return out
}
