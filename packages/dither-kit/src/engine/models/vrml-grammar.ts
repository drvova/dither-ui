// VRML's grammar (`../models.ts`): tokens into generic nodes and ROUTEs, for
// VRML97 / X3D classic and VRML 1.0 alike. `vrml.ts` builds the world from
// them, as `x3d.ts` does from X3D's XML.

export type VrmlNode = { type: string; name?: string; fields: Record<string, VrmlValue> }
export type VrmlValue = number[] | string[] | boolean | VrmlNode[]
export type VrmlRoute = { from: string; fromField: string; to: string; toField: string }

/** A node's fields read by their kind, each with its default. */
export const nums = (n: VrmlNode, key: string, def: number[]): number[] => {
  const v = n.fields[key]
  return Array.isArray(v) && (v.length === 0 || typeof v[0] === "number") ? (v as number[]) : def
}
export const children = (n: VrmlNode, ...keys: string[]): VrmlNode[] => {
  const out: VrmlNode[] = []
  for (const key of keys) {
    const v = n.fields[key]
    if (Array.isArray(v) && typeof v[0] === "object") out.push(...(v as VrmlNode[]))
  }
  return out
}
export const flag = (n: VrmlNode, key: string, def: boolean): boolean => {
  const v = n.fields[key]
  return typeof v === "boolean" ? v : def
}
export const word = (n: VrmlNode, key: string): string | undefined => {
  const v = n.fields[key]
  return Array.isArray(v) && typeof v[0] === "string" ? v[0] : undefined
}

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
      while (j < n && text[j] > " " && text[j] !== "," && !BRACKETS.has(text[j]) && text[j] !== "#" && text[j] !== '"')
        j++
      out.push(text.slice(i, j))
      i = j
    }
  }
  return out
}

export const isNumber = (t: string | undefined): boolean =>
  t !== undefined && t !== "" && /^[-+.\d]/.test(t) && !Number.isNaN(Number(t))

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
