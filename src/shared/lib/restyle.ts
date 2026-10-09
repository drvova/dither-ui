// Code in the reader's styling system. Snippets and Studio exports are
// authored once with Tailwind classes; `restyle` rewrites a snippet so the
// same look is written in vanilla CSS (a scoped stylesheet), CSS Modules or
// StyleX, from the declarations Tailwind's compiler gives each class
// (`virtual:dither-utilities`, built by `utility-map.ts`). Classes the map
// does not know stay classes — the kit's own stylesheet covers them.
import { ref } from "vue"
import UTILITIES from "virtual:dither-utilities"

export type UtilityRule = { chain: string[]; decl: [string, string][] }
export type UtilityMap = { order: Record<string, number>; rules: Record<string, UtilityRule[]>; props: Record<string, string> }

export const STYLINGS = ["tailwind", "css", "modules", "stylex"] as const
export type Styling = (typeof STYLINGS)[number]
export type Framework = "vue" | "svelte"
export const STYLING_LABELS: Record<Styling, string> = { tailwind: "Tailwind", css: "CSS", modules: "Modules", stylex: "StyleX" }
export const isStyling = (v: unknown): v is Styling => STYLINGS.includes(v as Styling)

/* ------------------------------ the preference ---------------------------- */

const STORAGE_KEY = "dither-styling"
const stored = (): Styling => {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return isStyling(v) ? v : "tailwind"
  } catch {
    return "tailwind"
  }
}

/** The reader's styling system — one choice for the docs and the Studio. */
export const styling = ref<Styling>(stored())

export function setStyling(next: Styling): void {
  styling.value = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // privacy mode: the choice lives for the session
  }
}

/* ------------------------------ compiling classes ------------------------- */

export type Compiled = {
  /** Declarations per variant chain (`[]` is the element itself), in cascade order. */
  chains: { chain: string[]; decl: [string, string][] }[]
  /** Classes the map does not know, or the target cannot express — kept as classes. */
  rest: string[]
}

/** `&:hover`, `&::before`, `&:not(:last-child)`: a selector StyleX can say. */
const SIMPLE_SELECTOR = /^&(::?[\w-]+(\([^()]*\))?)+$/
const TW_VAR = "var(--tw-"

/** `var(--tw-x, fallback)` → the value the chain gives `--tw-x`, the
 * registered initial, or the fallback; Tailwind's internals never reach the
 * output. */
function resolveVars(value: string, lookup: (name: string) => string | undefined): string {
  for (let pass = 0; pass < 8; pass++) {
    const at = value.indexOf(TW_VAR)
    if (at < 0) return value
    let depth = 0
    let comma = -1
    let end = -1
    for (let i = at + 3; i < value.length; i++) {
      const c = value[i]
      if (c === "(") depth++
      else if (c === ")") {
        if (--depth === 0) {
          end = i
          break
        }
      } else if (c === "," && depth === 1 && comma < 0) comma = i
    }
    if (end < 0) return value
    const name = value.slice(at + 4, comma < 0 ? end : comma).trim()
    const fallback = comma < 0 ? undefined : value.slice(comma + 1, end).trim()
    const found = lookup(name) ?? fallback
    if (found === undefined) return value
    value = value.slice(0, at) + found + value.slice(end + 1)
  }
  return value
}

const NUMBER = /^-?\d*\.?\d+$/

/** `calc(0.25rem * 4)` → `1rem`, `calc(10 * -1)` → `-10`, no-op shadows gone. */
function simplify(prop: string, value: string): string {
  value = value.replace(/calc\((-?\d*\.?\d+)([a-z%]*) \* (-?\d*\.?\d+)\)/g, (all, a: string, unit: string, b: string) => {
    if (!NUMBER.test(a) || !NUMBER.test(b)) return all
    const n = Math.round(Number(a) * Number(b) * 1e6) / 1e6
    return `${n}${unit}`
  })
  // Tailwind's gradient inputs are not properties an app transitions.
  if (prop === "transition-property") value = value.split(/,\s*/).filter((p) => !p.startsWith("--tw-")).join(", ")
  if (prop === "box-shadow" || prop === "text-shadow") {
    const parts = value.split(/,\s*(?![^(]*\))/).filter((p) => p.trim() !== "0 0 #0000")
    value = parts.length ? parts.join(", ") : "none"
  }
  return value
}

/** The declarations a class string stands for, in Tailwind's cascade order.
 * `strict` (StyleX) sends classes whose rules need a selector StyleX cannot
 * express, a custom property or `!important` to `rest` instead. */
export function compileUtilities(tokens: string[], strict = false): Compiled {
  const seen = new Set<string>()
  const known: string[] = []
  const rest: string[] = []
  for (const t of tokens) {
    if (!t || seen.has(t)) continue
    seen.add(t)
    const rules = UTILITIES.rules[t]
    const expressible =
      !!rules &&
      (!strict ||
        rules.every((r) => r.chain.every((item) => item.startsWith("@") || SIMPLE_SELECTOR.test(item)) && r.decl.every(([k, v]) => (!k.startsWith("--") || k.startsWith("--tw-")) && !v.includes("!important"))))
    ;(expressible ? known : rest).push(t)
  }
  known.sort((a, b) => UTILITIES.order[a] - UTILITIES.order[b])
  const chains = new Map<string, { chain: string[]; decl: Map<string, string> }>()
  for (const t of known)
    for (const rule of UTILITIES.rules[t]) {
      const key = rule.chain.join("\u0000")
      let entry = chains.get(key)
      if (!entry) chains.set(key, (entry = { chain: rule.chain, decl: new Map() }))
      for (const [k, v] of rule.decl) entry.decl.set(k, v)
    }
  const base = chains.get("")?.decl ?? new Map<string, string>()
  const out: Compiled["chains"] = []
  for (const { chain, decl } of chains.values()) {
    // A variant that only retunes a `--tw-*` input (hover:shadow-color) must
    // carry the element's declaration that reads it.
    if (chain.length)
      for (const [k, v] of base) if (!decl.has(k) && [...decl.keys()].some((name) => name.startsWith("--tw-") && v.includes(`var(${name}`))) decl.set(k, v)
    const lookup = (name: string) => decl.get(name) ?? (chain.length ? base.get(name) : undefined) ?? UTILITIES.props[name]
    const resolved: [string, string][] = []
    for (const [k, v] of decl) if (!k.startsWith("--tw-")) resolved.push([k, simplify(k, resolveVars(v, lookup))])
    if (resolved.length) out.push({ chain, decl: resolved })
  }
  return { chains: [...out.filter((c) => !c.chain.length), ...out.filter((c) => c.chain.length)], rest }
}

/* ------------------------------ the rewrite ------------------------------- */

type Named = { name: string; compiled: Compiled }

const camel = (s: string) => s.replace(/[^A-Za-z0-9]+(.)?/g, (_, c?: string) => (c ? c.toUpperCase() : ""))
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

const HINTS: [RegExp, string][] = [
  [/^flex-col$/, "stack"],
  [/^(inline-)?flex$/, "row"],
  [/^(inline-)?grid$/, "grid"],
  [/^(absolute|fixed|inset-0)$/, "layer"],
  [/^relative$/, "frame"],
]

function baseName(tag: string, tokens: string[]): string {
  if (/^[A-Z]/.test(tag)) return lowerFirst(tag.replace(/^Dither/, "")) || "item"
  if (tag === "div" || tag === "span") {
    for (const [re, name] of HINTS) if (tokens.some((t) => re.test(t))) return name
    return tag === "div" ? "box" : "text"
  }
  return camel(tag)
}

class Names {
  private styles: Named[] = []
  private byKey = new Map<string, string>()
  private used = new Set<string>()
  get all(): Named[] {
    return this.styles
  }
  /** One name per distinct declaration set; collisions count up. */
  claim(wanted: string, compiled: Compiled): string {
    const key = JSON.stringify(compiled.chains)
    const had = this.byKey.get(key)
    if (had) return had
    let name = wanted
    for (let n = 2; this.used.has(name); n++) name = `${wanted}${n}`
    this.used.add(name)
    this.byKey.set(key, name)
    this.styles.push({ name, compiled })
    return name
  }
}

const TAG_RE = /<([A-Za-z][A-Za-z0-9]*)((?:"[^"]*"|'[^']*'|\{[^}]*\}|<!--[\s\S]*?-->|\/(?!>)|[^">/])*)(\/?)>/g
const STRING_RE = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g

type Attr = { start: number; end: number; value: string; braces: boolean }

/** `name="…"`, `name='…'` or `name={…}` inside an attribute string. */
function attrOf(attrs: string, name: string): Attr | null {
  const re = new RegExp(`(^|\\s)${name.replace(/[:.]/g, "\\$&")}=("([^"]*)"|'([^']*)'|\\{([^}]*)\\})`)
  const m = re.exec(attrs)
  if (!m) return null
  const start = m.index + m[1].length
  return { start, end: start + m[0].length - m[1].length, value: m[3] ?? m[4] ?? m[5] ?? "", braces: m[5] !== undefined }
}

const parseInline = (style: string): [string, string][] =>
  style
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const k = d.indexOf(":")
      return [d.slice(0, k).trim(), d.slice(k + 1).trim()] as [string, string]
    })
    .filter(([k, v]) => k && v)

type Target = { system: Exclude<Styling, "tailwind">; framework: Framework }

/** The expression of a dynamic class binding with its literals named: each
 * string literal with known utilities becomes a style, referenced the way
 * the target spells it. `lossy` says a literal also held classes the target
 * could not take. */
function nameLiterals(expr: string, names: Names, target: Target): { expr: string; found: boolean; lossy: boolean } {
  let found = false
  let lossy = false
  const out = expr.replace(STRING_RE, (all, single?: string, double?: string) => {
    const text = single ?? double ?? ""
    const tokens = text.split(/\s+/).filter(Boolean)
    const compiled = compileUtilities(tokens, target.system === "stylex")
    if (!compiled.chains.length) return all
    found = true
    const first = tokens.find((t) => !compiled.rest.includes(t)) ?? "style"
    const name = names.claim(camel(first), compiled)
    const kept = compiled.rest.join(" ")
    if (kept) lossy = true
    if (target.system === "stylex") return `styles.${name}`
    if (target.system === "modules") return kept ? `$style.${name} + ' ${kept}'` : `$style.${name}`
    return `'${name}${kept ? " " + kept : ""}'`
  })
  return { expr: out, found, lossy }
}

/** StyleX takes styles, not class strings: the common binding shapes become
 * `stylex.attrs` arguments; anything else keeps its class binding. */
function stylexArgs(expr: string): string[] | null {
  const e = expr.trim()
  if (/^\[[\s\S]*\]$/.test(e)) return splitTop(e.slice(1, -1)).flatMap((part) => stylexArgs(part) ?? [part])
  if (/^\{[\s\S]*\}$/.test(e))
    return splitTop(e.slice(1, -1)).map((pair) => {
      const k = pair.indexOf(":")
      return `${pair.slice(k + 1).trim()} && ${pair.slice(0, k).trim()}`
    })
  if (/^styles\.\w+$/.test(e)) return [e]
  if (/^[\w$.!]+\s*(\?|&&)/.test(e) && /styles\.\w+/.test(e) && !/['"]/.test(e)) return [e]
  return null
}

function splitTop(list: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quote: string | null = null
  let buf = ""
  for (const c of list) {
    if (quote) {
      buf += c
      if (c === quote) quote = null
      continue
    }
    if (c === "'" || c === '"') quote = c
    else if ("([{".includes(c)) depth++
    else if (")]}".includes(c)) depth--
    if (c === "," && depth === 0) {
      parts.push(buf.trim())
      buf = ""
      continue
    }
    buf += c
  }
  if (buf.trim()) parts.push(buf.trim())
  return parts
}

function rewriteTag(tag: string, attrs: string, names: Names, target: Target): string {
  const svelte = target.framework === "svelte"
  const stylex = target.system === "stylex"
  const modules = target.system === "modules"
  const classAttr = attrOf(attrs, "class")
  const dynamic = svelte ? (classAttr?.braces ? classAttr : null) : attrOf(attrs, ":class")
  const fixed = svelte ? (classAttr?.braces ? null : classAttr) : classAttr
  const style = attrOf(attrs, "style")
  const inline = style && !style.braces ? style : null
  if ((!fixed && !dynamic && !inline) || fixed?.value.includes("{{")) return attrs

  const tokens = fixed ? fixed.value.split(/\s+/).filter(Boolean) : []
  const compiled = compileUtilities(tokens, stylex)
  if (inline) {
    // Inline declarations join the element's own rule (they beat classes, so they come last).
    const base = compiled.chains.find((c) => !c.chain.length)
    base ? base.decl.push(...parseInline(inline.value)) : compiled.chains.unshift({ chain: [], decl: parseInline(inline.value) })
  }
  const own = compiled.chains.length ? names.claim(baseName(tag, tokens), compiled) : null
  const bindDynamic = () => (svelte ? `class={${dynamic!.value}}` : `:class="${dynamic!.value}"`)
  const parts: string[] = []
  const kept = compiled.rest
  let changed = !!own
  if (stylex) {
    const args = own ? [`styles.${own}`] : []
    if (dynamic) {
      // Only the shapes attrs() can take are named; anything else keeps its binding.
      const shape = stylexArgs(dynamic.value.replace(STRING_RE, "styles._"))
      const bound = shape ? nameLiterals(dynamic.value, names, target) : null
      const named = bound?.found && !bound.lossy ? stylexArgs(bound.expr) : null
      if (named) {
        args.push(...named)
        changed = true
      } else parts.push(bindDynamic())
    }
    if (args.length) parts.unshift(svelte ? `{...stylex.attrs(${args.join(", ")})}` : `v-bind="stylex.attrs(${args.join(", ")})"`)
    if (kept.length) parts.push(`class="${kept.join(" ")}"`)
  } else {
    const bound = dynamic ? nameLiterals(dynamic.value, names, target) : null
    if (bound?.found) changed = true
    if (modules && !svelte) {
      if (kept.length) parts.push(`class="${kept.join(" ")}"`)
      const bindings = [...(own ? [`$style.${own}`] : []), ...(bound ? [bound.expr] : [])]
      if (bindings.length) parts.push(`:class="${bindings.length > 1 ? `[${bindings.join(", ")}]` : bindings[0]}"`)
    } else {
      const classes = [...(own ? [own] : []), ...kept]
      if (classes.length) parts.push(`class="${classes.join(" ")}"`)
      if (bound) parts.push(svelte ? `class={${bound.expr}}` : `:class="${bound.expr}"`)
    }
  }
  if (!changed) return attrs

  // Splice the rewritten attributes where the first of them stood.
  const removed = [fixed, dynamic, inline].filter((a): a is Attr => !!a)
  let out = attrs
  for (const a of [...removed].sort((a, b) => b.start - a.start)) out = out.slice(0, a.start).replace(/\s+$/, "") + out.slice(a.end)
  const prefix = attrs.slice(0, Math.min(...removed.map((a) => a.start))).replace(/\s+$/, "")
  const remainder = out.slice(prefix.length)
  return `${prefix} ${parts.join(" ")}${remainder.trim() ? remainder : ""}`
}

/* ------------------------------ emitters ---------------------------------- */

function cssText(styles: Named[]): string {
  const blocks: string[] = []
  for (const { name, compiled } of styles)
    for (const { chain, decl } of compiled.chains) {
      let selector = `.${name}`
      const ats: string[] = []
      for (const item of chain) item.startsWith("@") ? ats.push(item) : (selector = item.replace(/&/g, selector))
      const inner = decl.map(([k, v]) => `${k}: ${v};`)
      let text = [`${selector} {`, ...inner.map((l) => `  ${l}`), "}"].join("\n")
      for (const at of ats.reverse()) text = [`${at} {`, ...text.split("\n").map((l) => `  ${l}`), "}"].join("\n")
      blocks.push(text)
    }
  return blocks.join("\n")
}

type Cond = string | null | Map<string, Cond>

const cssProp = (prop: string) => (prop.startsWith("-") ? prop.slice(1) : prop).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())

function stylexObject(compiled: Compiled): Map<string, Cond> {
  const tree = new Map<string, Cond>()
  for (const { chain, decl } of compiled.chains) {
    // StyleX nests conditions per property: pseudo-classes first, then at-rules.
    const keys = [...chain.filter((c) => !c.startsWith("@")).map((c) => c.slice(1)), ...chain.filter((c) => c.startsWith("@"))]
    for (const [prop, value] of decl) {
      const name = cssProp(prop)
      if (!keys.length) {
        const had = tree.get(name)
        if (had instanceof Map) had.set("default", value)
        else tree.set(name, value)
        continue
      }
      const top = tree.get(name)
      let node: Map<string, Cond>
      if (top instanceof Map) node = top
      else {
        node = new Map<string, Cond>([["default", typeof top === "string" ? top : null]])
        tree.set(name, node)
      }
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i]
        const had = node.get(k)
        if (i === keys.length - 1) {
          had instanceof Map ? had.set("default", value) : node.set(k, value)
          break
        }
        if (had instanceof Map) node = had
        else {
          const next = new Map<string, Cond>([["default", typeof had === "string" ? had : null]])
          node.set(k, next)
          node = next
        }
      }
    }
  }
  return tree
}

const key = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k))
const WIDTH = 100

function printCond(value: Cond, indent: string): string {
  if (value === null) return "null"
  if (typeof value === "string") return JSON.stringify(value)
  const entries = [...value].map(([k, v]) => `${key(k)}: ${printCond(v, indent + "  ")}`)
  const flat = `{ ${entries.join(", ")} }`
  if (!flat.includes("\n") && indent.length + flat.length <= WIDTH) return flat
  return `{\n${entries.map((e) => `${indent}  ${e},`).join("\n")}\n${indent}}`
}

function stylexText(styles: Named[], indent: string): string {
  const entries = styles.map(({ name, compiled }) => `${indent}  ${key(name)}: ${printCond(stylexObject(compiled), indent + "  ")},`)
  return `${indent}const styles = stylex.create({\n${entries.join("\n")}\n${indent}})`
}

/* ------------------------------ placement --------------------------------- */

const STYLEX_IMPORT = `import * as stylex from "@stylexjs/stylex"`

function withScript(code: string, framework: Framework, lines: (indent: string) => string): string {
  const open = framework === "svelte" ? /<script lang="ts">\n/ : /<script setup[^>]*>\n/
  const m = code.match(open)
  if (m) {
    const start = m.index! + m[0].length
    const close = code.indexOf("</script>", start)
    const body = code.slice(start, close)
    const indent = framework === "svelte" ? "  " : ""
    const imports = body.match(/^(?:\s*import .*\n)+/)
    const head = imports ? imports[0] : ""
    const rest = body.slice(head.length)
    const headOut = head.includes("@stylexjs/stylex") ? head : `${head}${indent}${STYLEX_IMPORT}\n`
    const restOut = rest.replace(/\n*$/, "")
    return `${code.slice(0, start)}${headOut}${restOut ? restOut + "\n" : ""}\n${lines(indent)}\n${code.slice(close)}`
  }
  const block = framework === "svelte" ? `<script lang="ts">\n  ${STYLEX_IMPORT}\n\n${lines("  ")}\n</script>` : `<script setup lang="ts">\n${STYLEX_IMPORT}\n\n${lines("")}\n</script>`
  // An SFC without a script gets one; a fragment gets the lines it would add.
  if (/<template>/.test(code) || framework === "svelte") return `${block}\n\n${code}`
  return `${STYLEX_IMPORT}\n\n${lines("")}\n\n${code}`
}

/** `code` written in `system`: the classes the map knows become the target's
 * styles, every unknown class stays, Tailwind returns the code untouched. */
export function restyle(code: string, system: Styling, framework: Framework = "vue"): string {
  if (system === "tailwind") return code
  const target: Target = { system: system === "modules" && framework === "svelte" ? "css" : system, framework }
  const names = new Names()
  const out = code.replace(TAG_RE, (all, tag: string, attrs: string, selfClose: string) => {
    if (!/\b(class|style)=/.test(attrs)) return all
    const next = rewriteTag(tag, attrs, names, target)
    return next === attrs ? all : `<${tag}${next}${selfClose ? " /" : ""}>`
  })
  if (!names.all.length) return code
  if (target.system === "stylex") return withScript(out, framework, (indent) => stylexText(names.all, indent))
  const tagName = target.system === "modules" ? "<style module>" : framework === "svelte" ? "<style>" : "<style scoped>"
  return `${out.replace(/\s+$/, "")}\n\n${tagName}\n${cssText(names.all)}\n</style>`
}
