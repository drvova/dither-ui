// Stanford PLY, ASCII and binary of either byte order; a trained capture's
// Gaussians become splats (`../models.ts`).

import { addMesh, emptyWorld, finishWorld, type World } from "../world-scene"
import { SPLAT_PLY_PROPS, splatsFromPly } from "../splats"
import { average, decode, GREY, splatWorld, toBytes } from "./shared"

const PLY_SIZE: Record<string, number> = {
  char: 1,
  int8: 1,
  uchar: 1,
  uint8: 1,
  short: 2,
  int16: 2,
  ushort: 2,
  uint16: 2,
  int: 4,
  int32: 4,
  uint: 4,
  uint32: 4,
  float: 4,
  float32: 4,
  double: 8,
  float64: 8,
}

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
  // a trained capture: a binary vertex element of float32 Gaussians, first in the file
  const vertex = elements[0]?.name === "vertex" ? elements[0] : null
  const float = (t: string) => t === "float" || t === "float32"
  if (
    format !== "ascii" &&
    vertex &&
    vertex.props.every((q) => !q.list) &&
    SPLAT_PLY_PROPS.every((name) => vertex.props.some((q) => q.name === name && float(q.type)))
  ) {
    const offsets = {} as Record<(typeof SPLAT_PLY_PROPS)[number], number>
    let size = 0
    for (const q of vertex.props) {
      if ((SPLAT_PLY_PROPS as readonly string[]).includes(q.name))
        offsets[q.name as (typeof SPLAT_PLY_PROPS)[number]] = size
      size += PLY_SIZE[q.type] ?? 4
    }
    return splatWorld(splatsFromPly(bytes, bodyStart, vertex.count, size, offsets, format !== "binary_big_endian"))
  }
  const points: number[] = []
  const uvs: number[] = []
  let hasUv = false
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
      const s = row.s ?? row.u ?? row.texture_u
      const t = row.t ?? row.v ?? row.texture_v
      if (typeof s === "number" && typeof t === "number") {
        hasUv = true
        uvs.push(s, 1 - t)
      } else uvs.push(0, 0)
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
    } else if (el.name === "edge" && typeof row.vertex1 === "number" && typeof row.vertex2 === "number")
      edges.push([row.vertex1, row.vertex2])
  }
  if (format === "ascii") {
    const toks = decode(bytes.subarray(bodyStart)).split(/\s+/).filter(Boolean)
    let i = 0
    for (const el of elements)
      for (let n = 0; n < el.count && i < toks.length; n++) {
        const row: Record<string, number | number[]> = {}
        for (const prop of el.props) {
          if (prop.list) {
            const count = Math.min(+toks[i++] || 0, toks.length - i)
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
      ? faces
          .map((f, i) =>
            fcol[i * 3] >= 0 ? fcol.slice(i * 3, i * 3 + 3) : hasVcol ? average(vcol, f) : [0.8, 0.8, 0.8],
          )
          .flat()
      : hasVcol
        ? faces.flatMap((f) => average(vcol, f))
        : undefined
    addMesh(world, { points, faces, colors, uvs: hasUv ? uvs : undefined }, null, GREY, false)
  }
  if (edges.length) addMesh(world, { points, faces: edges }, null, GREY, false, { kind: "lines" })
  if (!faces.length && !edges.length && points.length)
    addMesh(world, { points, faces: [] }, null, GREY, false, { kind: "points" })
  return finishWorld(world)
}
