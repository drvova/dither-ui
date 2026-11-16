// X3D's XML encoding (`../models.ts`), read into VRML's nodes and built into
// a world by the same scene builder as VRML97 (`vrml.ts`).

import { emptyWorld, finishWorld, type World } from "../world-scene"
import { isNumber, type VrmlNode, type VrmlRoute, type VrmlValue } from "./vrml-grammar"
import { buildV2 } from "./vrml"

type XmlEl = { name: string; attrs: Record<string, string>; children: XmlEl[] }

const XML_ENTITIES: Record<string, string> = { quot: '"', amp: "&", lt: "<", gt: ">", apos: "'" }
const unescapeXml = (s: string) =>
  s.replace(/&(quot|amp|lt|gt|apos|#x[0-9a-fA-F]+|#\d+);/g, (_, e: string) =>
    e[0] === "#"
      ? String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
      : XML_ENTITIES[e],
  )

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
      if (a.fromNode && a.fromField && a.toNode && a.toField)
        routes.push({ from: a.fromNode, fromField: a.fromField, to: a.toNode, toField: a.toField })
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
        if (a.fromNode && a.fromField && a.toNode && a.toField)
          routes.push({ from: a.fromNode, fromField: a.fromField, to: a.toNode, toField: a.toField })
        continue
      }
      const kids = x3dNodes({ name: "", attrs: {}, children: [sub] }, defs, routes)
      if (!kids.length) continue
      const field = sub.attrs.containerField || X3D_CONTAINER[sub.name] || "children"
      const existing = node.fields[field]
      node.fields[field] = [
        ...(Array.isArray(existing) && typeof existing[0] === "object" ? (existing as VrmlNode[]) : []),
        ...kids,
      ]
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
