// Vue → Solid snippet translation.
//
// The docs' snippets are authored once, as Vue template fragments and
// short-form SFCs; the Solid kit carries the Vue kit's surface under the same
// names, so every Solid code tab is derived from the authored snippet the way
// the Svelte one is (`@/pages/docs/svelte-code`), never forked by hand. The
// markup is read into a small tree (tags found with the Svelte translator's
// own scanner) and written back as JSX, text and layout kept as authored:
// directives become Solid's control flow, slots become props, refs become
// signals read as calls and written through their setters. A file (a
// `<script setup>` with its markup) comes out as a `.tsx` module whose
// default export is the component; a fragment stays a fragment. Content that
// is not component code (shell, CSS, a TypeScript sketch) passes through.
import { camel, findTagEnd } from "@/pages/docs/svelte-code"
import { snippetKind } from "@/widgets/source/model/files"

/* ------------------------------ expressions ------------------------------ */

/** What the names in an expression are: a signal is read as a call and
 * written through its setter, a memo (or a loop's accessor) only read, a
 * store written through its setter by path, a rename spelled another way (a
 * scoped slot's field, read off its scope so it stays live). In a script a
 * signal or memo is the Vue ref it was: touched only through `.value`. */
interface Env {
  signals: ReadonlySet<string>
  memos: ReadonlySet<string>
  stores: ReadonlySet<string>
  renames: ReadonlyMap<string, string>
  script: boolean
}

const ID_START = /[A-Za-z_$]/
const ID_PART = /[\w$]/
const setter = (name: string) => `set${name.charAt(0).toUpperCase()}${name.slice(1)}`

/** End (exclusive) of the string literal opened at `from`. */
function stringEnd(code: string, from: number): number {
  const quote = code[from]
  for (let i = from + 1; i < code.length; i++) {
    if (code[i] === "\\") i++
    else if (code[i] === quote) return i + 1
  }
  return code.length
}

/** Index of the bracket that closes the one opened at `from`. */
function closing(code: string, from: number): number {
  let depth = 0
  for (let i = from; i < code.length; i++) {
    const c = code[i]
    if (c === '"' || c === "'" || c === "`") i = stringEnd(code, i) - 1
    else if ("([{".includes(c)) depth++
    else if (")]}".includes(c) && --depth === 0) return i
  }
  return code.length - 1
}

/** End (exclusive) of the expression assigned at `from`: the statement's end,
 * a comma or the bracket that closes around it. */
function valueEnd(code: string, from: number, script: boolean): number {
  let depth = 0
  for (let i = from; i < code.length; i++) {
    const c = code[i]
    if (c === '"' || c === "'" || c === "`") i = stringEnd(code, i) - 1
    else if ("([{".includes(c)) depth++
    else if (")]}".includes(c)) {
      if (--depth < 0) return i
    } else if (depth === 0 && (c === ";" || c === ",")) return i
    else if (depth === 0 && c === "\n" && script) {
      // a line that ends on an operator, or a next one that starts with one, goes on
      const before = code.slice(from, i).trimEnd().slice(-1)
      const after = code.slice(i).trimStart()[0] ?? ""
      if (!"+-*/%&|?:=<>(,".includes(before) && !".?:+-*/%&|".includes(after)) return i
    }
  }
  return code.length
}

const ASSIGN = /^\s*(\+\+|--|(?:[-+*/%]|\*\*|&&|\|\||\?\?)?=(?![=>]))/

/** `code` with its names spelled the Solid way (see `Env`). */
function rewrite(code: string, env: Env): string {
  let out = ""
  const open: string[] = []
  const last = () => out.trimEnd().slice(-1)
  for (let i = 0; i < code.length;) {
    const c = code[i]
    if (c === '"' || c === "'") {
      const end = stringEnd(code, i)
      out += code.slice(i, end)
      i = end
    } else if (c === "`") {
      // a template literal: its text as written, its `${…}` holes rewritten
      out += c
      for (i++; i < code.length && code[i] !== "`";) {
        if (code[i] === "\\") {
          out += code.slice(i, i + 2)
          i += 2
        } else if (code[i] === "$" && code[i + 1] === "{") {
          const end = closing(code, i + 1)
          out += `\${${rewrite(code.slice(i + 2, end), env)}}`
          i = end + 1
        } else out += code[i++]
      }
      out += "`"
      i++
    } else if (c === "/" && (code[i + 1] === "/" || code[i + 1] === "*")) {
      const end = code[i + 1] === "/" ? code.indexOf("\n", i) : code.indexOf("*/", i) + 2
      const stop = end < (code[i + 1] === "/" ? 0 : 2) ? code.length : end
      out += code.slice(i, stop)
      i = stop
    } else if (ID_START.test(c) && !/[\w$]/.test(code[i - 1] ?? "")) {
      let j = i + 1
      while (j < code.length && ID_PART.test(code[j])) j++
      const name = code.slice(i, j)
      const prev = last()
      const next = code.slice(j).trimStart()[0] ?? ""
      const property = prev === "." && !out.trimEnd().endsWith("...")
      const key = (prev === "{" || prev === ",") && next === ":" && open[open.length - 1] === "{"
      const shorthand =
        (prev === "{" || prev === ",") && (next === "," || next === "}") && open[open.length - 1] === "{"
      if (property || key) {
        out += name
        i = j
        continue
      }
      const renamed = env.renames.get(name)
      if (renamed) {
        out += shorthand ? `${name}: ${renamed}` : renamed
        i = j
        continue
      }
      if (env.stores.has(name)) {
        // a store is read as it is and written through its setter, by path
        const path: string[] = []
        let k = j
        for (;;) {
          const dot = /^\.([A-Za-z_$][\w$]*)/.exec(code.slice(k))
          if (dot) {
            path.push(JSON.stringify(dot[1]))
            k += dot[0].length
          } else if (code[k] === "[") {
            const end = closing(code, k)
            path.push(rewrite(code.slice(k + 1, end), env))
            k = end + 1
          } else break
        }
        const op = path.length ? ASSIGN.exec(code.slice(k)) : null
        if (!op) {
          out += name
          i = j
          continue
        }
        const from = k + op[0].length
        if (op[1] === "++" || op[1] === "--") {
          out += `${setter(name)}(${path.join(", ")}, (v) => v ${op[1][0]} 1)`
          i = from
          continue
        }
        const end = valueEnd(code, from, env.script)
        const value = rewrite(code.slice(from, end).trim(), env)
        out +=
          op[1] === "="
            ? `${setter(name)}(${path.join(", ")}, ${value})`
            : `${setter(name)}(${path.join(", ")}, (v) => v ${op[1].slice(0, -1)} ${value})`
        i = end
        continue
      }
      const signal = env.signals.has(name)
      if (!signal && !env.memos.has(name)) {
        out += name
        i = j
        continue
      }
      let k = j
      if (env.script) {
        // in a script the name is the ref itself until `.value` unwraps it
        const unwrap = /^\s*\.value\b/.exec(code.slice(j))
        if (!unwrap) {
          out += name
          i = j
          continue
        }
        k = j + unwrap[0].length
      }
      const read = `${name}()`
      // one step into a signal's value, assigned: the value replaced whole
      const member = signal ? /^(?:\.([A-Za-z_$][\w$]*)|(\[))/.exec(code.slice(k)) : null
      if (member) {
        const end = member[2] ? closing(code, k) + 1 : k + member[0].length
        const op = /^\s*=(?![=>])/.exec(code.slice(end))
        if (op) {
          const from = end + op[0].length
          const stop = valueEnd(code, from, env.script)
          const field = member[1] ?? `[${rewrite(code.slice(k + 1, end - 1), env)}]`
          out += `${setter(name)}({ ...${read}, ${field}: ${rewrite(code.slice(from, stop).trim(), env)} })`
          i = stop
          continue
        }
      }
      const op = signal ? ASSIGN.exec(code.slice(k)) : null
      if (!op) {
        out += shorthand ? `${name}: ${read}` : read
        i = k
        continue
      }
      const from = k + op[0].length
      if (op[1] === "++" || op[1] === "--") {
        out += `${setter(name)}(${read} ${op[1][0]} 1)`
        i = from
        continue
      }
      const end = valueEnd(code, from, env.script)
      const value = rewrite(code.slice(from, end).trim(), env)
      out += op[1] === "=" ? `${setter(name)}(${value})` : `${setter(name)}(${read} ${op[1].slice(0, -1)} ${value})`
      i = end
    } else {
      if ("([{".includes(c)) open.push(c)
      else if (")]}".includes(c)) open.pop()
      out += c
      i++
    }
  }
  return out
}

/** A comma list's top-level parts. */
function parts(list: string, by = ","): string[] {
  const out: string[] = []
  let depth = 0
  let from = 0
  for (let i = 0; i <= list.length; i++) {
    const c = list[i]
    if (c === '"' || c === "'" || c === "`") i = stringEnd(list, i) - 1
    else if (c && "([{".includes(c)) depth++
    else if (c && ")]}".includes(c)) depth--
    else if (i === list.length || (c === by && depth === 0)) {
      if (list.slice(from, i).trim()) out.push(list.slice(from, i).trim())
      from = i + 1
    }
  }
  return out
}

/** Where an expression's top-level `&&` and ternary `?` are (-1 when absent). */
function topLevel(e: string): { and: number; question: number } {
  const at = { and: -1, question: -1 }
  let depth = 0
  for (let i = 0; i < e.length; i++) {
    const c = e[i]
    if (c === '"' || c === "'" || c === "`") i = stringEnd(e, i) - 1
    else if ("([{".includes(c)) depth++
    else if (")]}".includes(c)) depth--
    else if (depth) continue
    else if (c === "?" && e[i + 1] !== "." && e[i + 1] !== "?" && e[i - 1] !== "?") {
      if (at.question < 0) at.question = i
    } else if (c === "&" && e[i + 1] === "&") at.and = i++
  }
  return at
}

/* ------------------------------ the markup tree --------------------------- */

interface El {
  tag: string
  /** Everything between the tag's name and its `>` (or `/>`), as written. */
  attrs: string
  selfClosing: boolean
  children: Node[]
  /** The indent of the line the tag opens on. */
  indent: number
}
/** Markup already written (a slot's content, placed where it goes). */
interface Written {
  written: string
  many: boolean
}
type Node = El | Written | string
const isEl = (n: Node | undefined): n is El => typeof n === "object" && "tag" in n

const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
])
/** A comment, held out of the markup while it is read: `\uE000<n>\uE000`. */
const HELD = /\uE000(\d+)\uE000/g

function parse(src: string): Node[] {
  const root: Node[] = []
  const stack: El[] = []
  const into = () => (stack.length ? stack[stack.length - 1].children : root)
  const text = (t: string) => {
    if (!t) return
    const at = into()
    if (typeof at[at.length - 1] === "string") at[at.length - 1] += t
    else at.push(t)
  }
  for (let i = 0; i < src.length;) {
    const lt = src.indexOf("<", i)
    if (lt < 0) {
      text(src.slice(i))
      break
    }
    text(src.slice(i, lt))
    const close = /^<\/([A-Za-z][\w.-]*)\s*>/.exec(src.slice(lt))
    if (close) {
      // an end tag closes the nearest open element of its name; a stray one is dropped
      const at = stack.map((e) => e.tag).lastIndexOf(close[1])
      if (at >= 0) stack.length = at
      i = lt + close[0].length
      continue
    }
    const open = /^<([A-Za-z][\w.-]*)/.exec(src.slice(lt))
    if (!open) {
      text("<")
      i = lt + 1
      continue
    }
    const end = findTagEnd(src, lt)
    const selfClosing = src[end - 1] === "/"
    const lineStart = src.lastIndexOf("\n", lt - 1) + 1
    const el: El = {
      tag: open[1],
      attrs: src.slice(lt + open[0].length, selfClosing ? end - 1 : end),
      selfClosing,
      children: [],
      indent: /^\s*/.exec(src.slice(lineStart, lt))![0].length,
    }
    into().push(el)
    if (!selfClosing && !VOID.has(el.tag)) stack.push(el)
    i = end + 1
  }
  return root
}

/* ------------------------------ writing JSX ------------------------------- */

/** Text whose first line stands at column `base`; its other lines carry
 * their own indent. */
interface Block {
  text: string
  base: number
}

const sp = (n: number) => " ".repeat(Math.max(0, n))

/** `text` moved `by` columns: every line but the first (which the caller places). */
function shift(text: string, by: number): string {
  if (!by) return text
  return text
    .split("\n")
    .map((l, i) => (i === 0 || !l.trim() ? l : by > 0 ? sp(by) + l : l.replace(new RegExp(`^ {0,${-by}}`), "")))
    .join("\n")
}
const place = (b: Block, at: number) => shift(b.text, at - b.base)
const multiline = (b: Block) => b.text.includes("\n")

/** Several nodes as one expression. */
function fragment(b: Block): Block {
  return multiline(b)
    ? { text: `<>\n${sp(b.base + 2)}${place(b, b.base + 2)}\n${sp(b.base)}</>`, base: b.base }
    : { text: `<>${b.text}</>`, base: b.base }
}

/** A directive's value, and the attributes without it. */
function take(attrs: string, name: string): [string | undefined, string] {
  const re = new RegExp(`\\s*(?<![\\w:@#.-])${name.replace(/[.:]/g, "\\$&")}(?:="([^"]*)"|='([^']*)')?(?![\\w:.-])`)
  const m = re.exec(attrs)
  if (!m) return [undefined, attrs]
  return [m[1] ?? m[2] ?? "", attrs.slice(0, m.index) + attrs.slice(m.index + m[0].length)]
}
const has = (attrs: string, name: string) => take(attrs, name)[0] !== undefined

const pascal = (s: string) => {
  const c = camel(s.replace(/:/g, "-"))
  return c.charAt(0).toUpperCase() + c.slice(1)
}

/** `keydown` → `KeyDown`: a DOM event the way Solid's JSX types spell it. */
const domEvent = (name: string) =>
  name.replace(
    /^(key|mouse|pointer|touch|drag|focus|animation|transition|composition|context|dbl|before|time|volume|loaded)(.*)$|^(.+)$/,
    (_, a?: string, b?: string, whole?: string) =>
      whole !== undefined ? pascal(whole) : pascal(a!) + (b ? b.charAt(0).toUpperCase() + b.slice(1) : ""),
  )

const KEYS: Record<string, string> = {
  enter: "Enter",
  esc: "Escape",
  escape: "Escape",
  space: " ",
  tab: "Tab",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  delete: "Delete",
}
const SYSTEM = ["ctrl", "shift", "alt", "meta"]

/** A Vue listener's value as the function Solid takes. */
function listener(raw: string, modifiers: string[], env: Env): string {
  const v = rewrite(raw.trim(), env).replace(/\$event\b/g, "e")
  const guards: string[] = []
  for (const m of modifiers) {
    if (m === "prevent") guards.push("e.preventDefault()")
    else if (m === "stop") guards.push("e.stopPropagation()")
    else if (m === "self") guards.push("if (e.target !== e.currentTarget) return")
    else if (m in KEYS) guards.push(`if (e.key !== ${JSON.stringify(KEYS[m])}) return`)
    else if (SYSTEM.includes(m)) guards.push(`if (!e.${m}Key) return`)
  }
  const reference = /^[\w$.]+$/.test(v)
  const closure = /^\(.*\)\s*=>/s.test(v) || /^[\w$]+\s*=>/.test(v)
  const statements = parts(v, ";")
  const event = /\$event\b/.test(raw)
  if (!guards.length) {
    if (reference || closure) return v
    const params = event ? "(e)" : "()"
    if (statements.length > 1) return `${params} => { ${statements.join("; ")} }`
    // an assignment (or an object) reads as a body unless parenthesized
    const assigns = /(^|[^=!<>])=([^=>]|$)/.test(v) && !/^[\w$.]+\(/.test(v)
    return assigns || v.startsWith("{") ? `${params} => (${v})` : `${params} => ${v}`
  }
  const call = reference ? `${v}(e)` : closure ? `(${v})(e)` : statements.join("; ")
  return `(e) => { ${[...guards, call].join("; ")} }`
}

/** A class binding as the pieces of one class: text, or an expression that
 * gives text (`on && 'x'` gives `false` in Solid, so it becomes a ternary). */
function classPieces(expr: string): string[] {
  const e = expr.trim()
  if (/^\[[\s\S]*\]$/.test(e)) return parts(e.slice(1, -1)).flatMap(classPieces)
  if (/^\{[\s\S]*\}$/.test(e))
    return parts(e.slice(1, -1)).map((pair) => {
      const colon = topLevelColon(pair)
      const key = pair.slice(0, colon).trim()
      const name = /^['"]/.test(key) ? key : `'${key}'`
      return `\${${pair.slice(colon + 1).trim()} ? ${name} : ''}`
    })
  const literal = /^(['"])((?:(?!\1)[^\\])*)\1$/.exec(e)
  if (literal) return [literal[2]]
  const at = topLevel(e)
  if (at.question < 0 && at.and > 0) return [`\${${e.slice(0, at.and).trim()} ? ${e.slice(at.and + 2).trim()} : ''}`]
  return [`\${${e}}`]
}

function topLevelColon(pair: string): number {
  let depth = 0
  for (let i = 0; i < pair.length; i++) {
    const c = pair[i]
    if (c === '"' || c === "'" || c === "`") i = stringEnd(pair, i) - 1
    else if ("([{".includes(c)) depth++
    else if (")]}".includes(c)) depth--
    else if (c === ":" && depth === 0) return i
  }
  return pair.length
}

/** One `class`: the fixed classes, then the bound ones. */
function classAttr(fixed: string | undefined, bound: string | undefined, env: Env): string {
  const pieces = [...(fixed ? [fixed] : []), ...(bound === undefined ? [] : classPieces(rewrite(bound, env)))]
  if (pieces.every((p) => !p.startsWith("${"))) return `class="${pieces.join(" ")}"`
  if (pieces.length === 1) return `class={${pieces[0].slice(2, -1)}}`
  return `class={\`${pieces.join(" ")}\`}`
}

const kebab = (prop: string) => prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

/** A style binding the way Solid takes it: an object under CSS property names. */
function styleAttr(fixed: string | undefined, bound: string | undefined, env: Env): string {
  if (bound === undefined) return `style="${fixed}"`
  // camelCase keys of the object literals in the binding become property names
  const value = rewrite(bound, env).replace(
    /([{,]\s*)([a-z]+(?:[A-Z][a-z]+)+)(\s*:)/g,
    (_, lead: string, prop: string, colon: string) => `${lead}"${kebab(prop)}"${colon}`,
  )
  if (!fixed) return `style={${value}}`
  const own = fixed
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => `"${d.slice(0, d.indexOf(":")).trim()}": "${d.slice(d.indexOf(":") + 1).trim()}"`)
  const literal = /^\{([\s\S]*)\}$/.exec(value.trim())
  return `style={{ ${[...own, literal ? literal[1].trim() : `...${value}`].join(", ")} }}`
}

/** `v-model` on a kit component: the value and the callback that takes the
 * next one; on a form element: its value (or `checked`) and its own event. */
function model(target: string, arg: string | undefined, modifiers: string[], el: El, env: Env): string {
  const t = target.trim()
  const read = rewrite(t, env)
  const simple = /^[A-Za-z_$][\w$]*$/.test(t) && env.signals.has(t)
  const write = (value: string) => rewrite(`${t} = ${value}`, env)
  if (/^[A-Z]/.test(el.tag)) {
    const prop = arg ? camel(arg) : "modelValue"
    const next = simple ? setter(t) : `(v) => ${/^set\w+\(/.test(write("v")) ? write("v") : `(${write("v")})`}`
    return `${prop}={${read}} onUpdate${pascal(prop)}={${next}}`
  }
  const type = /\stype="(checkbox|radio)"/.exec(el.attrs)?.[1]
  const checked = type === "checkbox"
  const value = checked ? "e.currentTarget.checked" : "e.currentTarget.value"
  const cast = modifiers.includes("number")
    ? `Number(${value})`
    : modifiers.includes("trim")
      ? `${value}.trim()`
      : value
  const event =
    checked || type === "radio" || el.tag === "select" || modifiers.includes("lazy") ? "onChange" : "onInput"
  const next = write(cast)
  return `${checked ? "checked" : "value"}={${read}} ${event}={(e) => ${/^set\w+\(/.test(next) ? next : `(${next})`}}`
}

/** An attribute that leaves the tag, with the space before it. */
const GONE = "\uE001"
const ATTR = /([@:#]?[A-Za-z_][\w:.-]*)(=(?:"[^"]*"|'[^']*'))?/g

/** An element's attributes as JSX attributes; the structural directives are
 * taken off before this. */
function attributes(el: El, env: Env, comments: string[]): string {
  const component = /^[A-Z]/.test(el.tag)
  let attrs = el.attrs
  let fixedClass: string | undefined
  let boundClass: string | undefined
  let fixedStyle: string | undefined
  let boundStyle: string | undefined
  // the fixed half of a pair is taken off when its binding stands beside it:
  // the two become one attribute where the first of them stood
  if (has(attrs, ":class") && has(attrs, "class")) {
    const first = attrs.search(/(?<![\w:@#.-]):?class=/)
    if (attrs[first] === ":") [fixedClass, attrs] = take(attrs, "class")
    else [boundClass, attrs] = take(attrs, ":class")
  }
  if (has(attrs, ":style") && has(attrs, "style")) {
    const first = attrs.search(/(?<![\w:@#.-]):?style=/)
    if (attrs[first] === ":") [fixedStyle, attrs] = take(attrs, "style")
    else [boundStyle, attrs] = take(attrs, ":style")
  }
  const name = (n: string) => (component && n.includes("-") && !n.startsWith("aria-") ? camel(n) : n)
  return attrs
    .replace(ATTR, (token, raw: string, valuePart?: string) => {
      const value = valuePart?.slice(2, -1)
      const [head, ...modifiers] = raw.split(".")
      if (head === "v-model" || head.startsWith("v-model:"))
        return model(value ?? "", head.slice(8) || undefined, modifiers, el, env)
      if (head.startsWith("@") || head.startsWith("v-on:")) {
        const event = head.replace(/^(@|v-on:)/, "")
        const fn = listener(value ?? "", modifiers, env)
        const prop = `on${component ? pascal(event) : domEvent(event)}`
        const how = ["once", "passive", "capture"].filter((m) => modifiers.includes(m))
        // a listener option is the native listener's, which Solid takes as an object
        if (how.length && !component)
          return `on:${event}={{ handleEvent: ${fn}, ${how.map((m) => `${m}: true`).join(", ")} }}`
        return `${prop}={${fn}}`
      }
      if (raw === "class" && boundClass !== undefined) return classAttr(value, boundClass, env)
      if (raw === ":class") return classAttr(fixedClass, value ?? "", env)
      if (raw === "style" && boundStyle !== undefined) return styleAttr(value, boundStyle, env)
      if (raw === ":style") return styleAttr(fixedStyle, value ?? "", env)
      if (raw === ":key") return GONE
      if (raw === "v-bind") return `{...${rewrite(value ?? "", env)}}`
      if (raw === "v-show") return `style={{ display: ${rewrite(value ?? "", env)} ? undefined : "none" }}`
      if (raw === "v-html") return `innerHTML={${rewrite(value ?? "", env)}}`
      if (raw === "v-text") return `textContent={${rewrite(value ?? "", env)}}`
      if (raw === "ref" && value !== undefined) return `ref={${env.signals.has(value) ? setter(value) : value}}`
      if (raw === ":is" && el.tag === "component") return `component={${rewrite(value ?? "", env)}}`
      if (raw.startsWith(":") || raw.startsWith("v-bind:")) {
        const bare = raw.replace(/^(:|v-bind:)/, "")
        return `${name(bare)}={${rewrite(value ?? bare, env)}}`
      }
      if (raw.startsWith("v-") || raw.startsWith("#")) return token
      return valuePart === undefined ? name(raw) : `${name(raw)}${valuePart}`
    })
    .replace(new RegExp(`\\s*${GONE}`, "g"), "")
    .replace(/[ \t]+(?=\n)/g, "")
    .replace(HELD, (_, n: string) => `/* ${comments[Number(n)]} */`)
}

/** Text between tags as JSX text: interpolations in single braces, comments
 * as JSX comments, and the characters JSX reads as syntax spelled out. */
function textOf(text: string, env: Env, comments: string[]): string {
  return text.replace(/\{\{([\s\S]*?)\}\}|\uE000(\d+)\uE000|[{}<>]/g, (all, expr?: string, held?: string) =>
    expr !== undefined
      ? `{${rewrite(expr.trim(), env)}}`
      : held !== undefined
        ? `{/* ${comments[Number(held)]} */}`
        : `{"${all}"}`,
  )
}

const blank = (n: Node) => typeof n === "string" && !n.trim()
const TAGS: Record<string, string> = { component: "Dynamic", Teleport: "Portal" }

/** A scoped slot's parameter: the name the scope takes, and each field the
 * markup named read off it (a destructured field would be read once). */
function scopeOf(params: string, env: Env): { param: string; env: Env } {
  const p = params.trim()
  if (!/^\{[\s\S]*\}$/.test(p)) return { param: p, env }
  const renames = new Map(env.renames)
  for (const field of parts(p.slice(1, -1))) {
    const [key, local] = field.split(/\s*[:=]\s*/)
    renames.set(field.includes(":") ? local.trim() : key.trim(), `scope.${key.trim()}`)
  }
  return { param: "scope", env: { ...env, renames } }
}

/** `v-for`'s value: what it walks and what it names. A list keyed by its
 * index is `<Index>` (the item an accessor); any other is `<For>` (the index
 * one). */
function loop(expr: string, key: string | undefined, env: Env) {
  const m = /^\(?\s*([\w$]+)\s*(?:,\s*([\w$]+))?\s*\)?\s+(?:in|of)\s+([\s\S]+)$/.exec(expr.trim())
  if (!m) return { tag: "For", each: rewrite(expr, env), args: "item", env }
  const [, alias, index, raw] = m
  const each = /^\d+$/.test(raw.trim())
    ? `Array.from({ length: ${raw.trim()} }, (_, k) => k + 1)`
    : rewrite(raw.trim(), env)
  const byIndex = !!index && key?.trim() === index
  const memos = new Set(env.memos)
  if (byIndex) memos.add(alias)
  else if (index) memos.add(index)
  return {
    tag: byIndex ? "Index" : "For",
    each,
    args: index ? `(${alias}, ${index})` : `(${alias})`,
    env: { ...env, memos },
  }
}

class Writer {
  constructor(private comments: string[]) {}

  /** A run of sibling nodes; an `v-if` and the branches after it are one. */
  nodes(nodes: Node[], env: Env): string {
    let out = ""
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]
      if (typeof n === "string") {
        out += textOf(n, env, this.comments)
        continue
      }
      if (!isEl(n)) {
        out += n.written
        continue
      }
      if (!has(n.attrs, "v-if")) {
        out += this.element(n, env).text
        continue
      }
      // the chain: v-if, then each v-else-if / v-else across blank text and comments
      const chain: El[] = [n]
      let trailing = ""
      for (;;) {
        let j = i + 1
        let between = ""
        while (j < nodes.length && typeof nodes[j] === "string" && !(nodes[j] as string).replace(HELD, "").trim())
          between += nodes[j++] as string
        const next = nodes[j]
        if (!isEl(next) || !(has(next.attrs, "v-else-if") || has(next.attrs, "v-else"))) break
        trailing += between.replace(/\s+$/, "")
        chain.push(next)
        i = j
        if (has(next.attrs, "v-else")) break
      }
      out += this.branches(chain, env).text + textOf(trailing, env, this.comments)
    }
    return out
  }

  /** What a `<template>` (or an element) holds, as one block. */
  private inner(el: El, env: Env): { block: Block; many: boolean } {
    const text = this.nodes(el.children, env)
    const items = el.children.filter((c) => !blank(c))
    const lead = /^\s*/.exec(text)![0]
    const base = lead.includes("\n") ? lead.length - lead.lastIndexOf("\n") - 1 : el.indent + 2
    const [only] = items
    const many = items.length !== 1 || typeof only === "string" || (!isEl(only) && only.many)
    return { block: { text: text.trim(), base }, many }
  }

  /** A branch's or a loop's body: the element itself, or a `<template>`'s
   * content (`single` wants one expression, so several nodes are a fragment). */
  private body(el: El, attrs: string, env: Env, single: boolean): Block {
    if (el.tag !== "template") return this.element({ ...el, attrs }, env)
    const { block, many } = this.inner(el, env)
    return single && many ? fragment(block) : block
  }

  private branches(chain: El[], env: Env): Block {
    const at = chain[0].indent
    const arms = chain.map((el) => {
      let attrs = el.attrs
      let when: string | undefined
      for (const d of ["v-if", "v-else-if", "v-else"]) {
        const [v, rest] = take(attrs, d)
        if (v !== undefined && d !== "v-else") when = v
        attrs = rest
      }
      return { el, attrs, when: when === undefined ? undefined : rewrite(when, env) }
    })
    const last = arms[arms.length - 1]
    const otherwise = arms.length > 1 && last.when === undefined ? this.body(last.el, last.attrs, env, true) : null
    const tests = otherwise ? arms.slice(0, -1) : arms
    /** `<Tag when fallback>`: on one line while the fallback is. */
    const open = (tag: string, when: string | undefined) => {
      const test = when === undefined ? "" : ` when={${when}}`
      if (!otherwise) return `<${tag}${test}>`
      if (!multiline(otherwise) && `<${tag}${test} fallback={${otherwise.text}}>`.length + at <= 100)
        return `<${tag}${test} fallback={${otherwise.text}}>`
      const lines = [
        ...(when === undefined ? [] : [`${sp(at + 2)}when={${when}}`]),
        `${sp(at + 2)}fallback={`,
        `${sp(at + 4)}${place(otherwise, at + 4)}`,
        `${sp(at + 2)}}`,
      ]
      return `<${tag}\n${lines.join("\n")}\n${sp(at)}>`
    }
    const wrap = (head: string, body: Block, tag: string, col: number): string =>
      multiline(body) || head.includes("\n")
        ? `${head}\n${sp(col + 2)}${place(body, col + 2)}\n${sp(col)}</${tag}>`
        : `${head}${body.text}</${tag}>`
    if (tests.length === 1) {
      const body = this.body(tests[0].el, tests[0].attrs, env, false)
      return { text: wrap(open("Show", tests[0].when), body, "Show", at), base: at }
    }
    const matches = tests.map(({ el, attrs, when }) =>
      wrap(`<Match when={${when}}>`, this.body(el, attrs, env, false), "Match", at + 2),
    )
    return {
      text: `${open("Switch", undefined)}\n${matches.map((m) => sp(at + 2) + m).join("\n")}\n${sp(at)}</Switch>`,
      base: at,
    }
  }

  /** One element, its directives become what wraps it. */
  element(el: El, env: Env): Block {
    const at = el.indent
    let attrs = el.attrs
    const [each, afterFor] = take(attrs, "v-for")
    if (each !== undefined) {
      const [key, rest] = take(afterFor, ":key")
      const l = loop(each, key, env)
      const body = this.body(el, rest, l.env, true)
      return {
        text: multiline(body)
          ? `<${l.tag} each={${l.each}}>\n${sp(at + 2)}{${l.args} => (\n${sp(at + 4)}${place(body, at + 4)}\n${sp(at + 2)})}\n${sp(at)}</${l.tag}>`
          : `<${l.tag} each={${l.each}}>{${l.args} => ${body.text}}</${l.tag}>`,
        base: at,
      }
    }
    if (el.tag === "template" || el.tag === "slot") {
      // a bare <template> groups; a <slot> is where the children go
      if (el.tag === "slot") return { text: "{props.children}", base: at }
      return fragment(this.inner(el, env).block)
    }
    // a scoped default slot: the children are a function of the scope
    let scoped: string | undefined
    ;[scoped, attrs] = take(attrs, "v-slot")
    if (scoped === undefined) [scoped, attrs] = take(attrs, "v-slot:default")
    let children = el.children
    // `<template #default="…">` is the same slot, written out: its content
    // stands where it stood, under the scope it names
    const whole = children.find(
      (c): c is El => isEl(c) && c.tag === "template" && /^\s*(?:#default|v-slot(?::default)?)(?:=|\s*$)/.test(c.attrs),
    )
    if (whole)
      scoped ??=
        take(whole.attrs, "#default")[0] || take(whole.attrs, "v-slot:default")[0] || take(whole.attrs, "v-slot")[0]
    const inside = scoped ? scopeOf(scoped, env) : null
    if (whole) {
      const { block, many } = this.inner(whole, inside?.env ?? env)
      children = children.map((c) => (c === whole ? { written: place(block, at + 2), many } : c))
    }
    // named slots: each `<template #name>` is a prop of that name
    const props: string[] = []
    if (/^[A-Z]/.test(el.tag)) {
      const kept: Node[] = []
      for (const c of children) {
        const slot =
          isEl(c) && c.tag === "template" ? /^\s*(?:#|v-slot:)([\w-]+)(?:="([^"]*)")?\s*$/.exec(c.attrs) : null
        if (!isEl(c) || !slot) {
          kept.push(c)
          continue
        }
        // the slot leaves with the blank text that led to it
        if (blank(kept[kept.length - 1] ?? "x")) kept.pop()
        const scope = slot[2] === undefined ? null : scopeOf(slot[2], env)
        const { block, many } = this.inner(c, scope?.env ?? env)
        const name = camel(slot[1])
        const authored = c.children.map((n) => (typeof n === "string" ? n : "<")).join("")
        if (!scope && !multiline(block) && !/[<{}\uE000]/.test(authored)) {
          // a slot of plain words is a string
          props.push(`${name}=${JSON.stringify(block.text)}`)
          continue
        }
        const value = many ? fragment(block) : block
        const head = scope ? `{(${scope.param}) => ` : "{"
        if (!multiline(value) && !authored.includes("\n")) props.push(`${name}=${head}${value.text}}`)
        else
          props.push(
            `${name}=${head}${scope ? "(" : ""}\n${sp(at + 4)}${place(value, at + 4)}\n${sp(at + 2)}${scope ? ")" : ""}}`,
          )
      }
      children = kept
    }
    const tag = TAGS[el.tag] ?? el.tag
    let open = `<${tag}${attributes({ ...el, attrs }, env, this.comments)}`
    if (props.length) open = `${open.trimEnd()}\n${props.map((p) => sp(at + 2) + p).join("\n")}\n${sp(at)}`
    const empty = children.every(blank)
    if (el.selfClosing || VOID.has(el.tag) || (props.length && empty))
      return { text: `${el.selfClosing || props.length ? open : `${open.trimEnd()} `}/>`, base: at }
    let content: string
    if (inside) {
      const { block, many } = this.inner({ ...el, children }, inside.env)
      const value = many ? fragment(block) : block
      content =
        multiline(value) || children.some((c) => typeof c === "string" && c.includes("\n"))
          ? `\n${sp(at + 2)}{(${inside.param}) => (\n${sp(at + 4)}${place(value, at + 4)}\n${sp(at + 2)})}\n${sp(at)}`
          : `{(${inside.param}) => ${value.text}}`
    } else content = this.nodes(children, env)
    return { text: `${open}>${content}</${tag}>`, base: at }
  }
}

/* ------------------------------ the script -------------------------------- */

const LIFECYCLE: [RegExp, string][] = [
  [/\bonMounted\(/g, "onMount("],
  [/\bonBeforeUnmount\(/g, "onCleanup("],
  [/\bonUnmounted\(/g, "onCleanup("],
  [/\bawait nextTick\(\)/g, "await Promise.resolve()"],
  [/\bnextTick\(/g, "queueMicrotask("],
  [/\bwatchEffect\(/g, "createEffect("],
]

/** The names a script declares, by what Vue made them. */
function declared(script: string) {
  const names = (re: RegExp) => new Set([...script.matchAll(re)].map((m) => m[1]))
  return {
    signals: names(/\bconst\s+([\w$]+)\s*=\s*(?:shallowR|r)ef(?=[(<])/g),
    memos: names(/\bconst\s+([\w$]+)\s*=\s*computed(?=[(<])/g),
    stores: names(/\bconst\s+([\w$]+)\s*=\s*reactive(?=[(<])/g),
    any: names(/\b(?:const|let|var|function)\s+([\w$]+)/g),
  }
}

/** A script's own lines, Vue's reactivity spelled as Solid's. */
function scriptOf(script: string, env: Env): string {
  let code = script
    .replace(
      /\bconst\s+([\w$]+)\s*=\s*(?:shallowR|r)ef(?=[(<])/g,
      (_, n: string) => `const [${n}, ${setter(n)}] = createSignal`,
    )
    .replace(/\bconst\s+([\w$]+)\s*=\s*computed(?=[(<])/g, "const $1 = createMemo")
    .replace(/\bconst\s+([\w$]+)\s*=\s*reactive(?=[(<])/g, (_, n: string) => `const [${n}, ${setter(n)}] = createStore`)
  // watch(source, effect) → an effect on that source, as lazy as Vue's
  code = code.replace(/\bwatch\(/g, (all, at: number) => {
    const end = closing(code, at + all.length - 1)
    return parts(code.slice(at + all.length, end)).length >= 2 ? "createEffect(on(" : all
  })
  for (const [re, to] of LIFECYCLE) code = code.replace(re, to)
  return rewrite(code, { ...env, script: true })
}

/** `createEffect(on(a, b)` closed: the call `watch(` opened has one more
 * bracket to close, and Vue's watcher waits for the first change. */
function closeWatchers(code: string): string {
  for (let from = 0; ;) {
    const at = code.indexOf("createEffect(on(", from)
    if (at < 0) return code
    const end = closing(code, at + "createEffect(on".length)
    code = `${code.slice(0, end)}, { defer: true }))${code.slice(end + 1)}`
    from = at + 1
  }
}

const SOLID: [string, RegExp, string][] = [
  ["createEffect", /\bcreateEffect\(/, "solid-js"],
  ["createMemo", /\bcreateMemo[(<]/, "solid-js"],
  ["createSignal", /\bcreateSignal[(<]/, "solid-js"],
  ["For", /<For\b/, "solid-js"],
  ["Index", /<Index\b/, "solid-js"],
  ["Match", /<Match\b/, "solid-js"],
  ["on", /\bcreateEffect\(on\(/, "solid-js"],
  ["onCleanup", /\bonCleanup\(/, "solid-js"],
  ["onMount", /\bonMount\(/, "solid-js"],
  ["Show", /<Show\b/, "solid-js"],
  ["Switch", /<Switch\b/, "solid-js"],
  ["createStore", /\bcreateStore[(<]/, "solid-js/store"],
  ["Dynamic", /<Dynamic\b/, "solid-js/web"],
  ["Portal", /<Portal\b/, "solid-js/web"],
]

/** The `solid-js` imports a piece of translated code needs. */
function solidImports(code: string): string[] {
  const by = new Map<string, string[]>()
  for (const [name, re, from] of SOLID) if (re.test(code)) by.set(from, [...(by.get(from) ?? []), name])
  return [...by].map(([from, names]) => `import { ${names.join(", ")} } from "${from}"`)
}

/* ------------------------------ the snippet ------------------------------- */

// (a snippet authored inside a Vue file may spell its end tag `<\/script>`)
const SETUP = /<script setup[^>]*>\n?([\s\S]*?)\n?<\\?\/script>/
const TEMPLATE = /^<template>\n?([\s\S]*?)\n?<\/template>\s*$/

/** The names markup writes to that no script declares: a model's target,
 * what a listener assigns and an element's `ref` are state, so they read as
 * signals too. */
function inferred(markup: string, known: ReadonlySet<string>): Set<string> {
  const out = new Set<string>()
  const local = new Set<string>()
  for (const m of markup.matchAll(/\sv-for="\(?\s*([\w$]+)\s*(?:,\s*([\w$]+))?/g)) {
    local.add(m[1])
    if (m[2]) local.add(m[2])
  }
  for (const m of markup.matchAll(/(?:\sv-slot(?::[\w-]+)?|#[\w-]+)="([^"]*)"/g))
    for (const n of m[1].matchAll(/[\w$]+/g)) local.add(n[0])
  const add = (name: string) => !known.has(name) && !local.has(name) && out.add(name)
  for (const m of markup.matchAll(/\sref="([A-Za-z_$][\w$]*)"/g)) add(m[1])
  for (const m of markup.matchAll(/\sv-model(?::[\w-]+)?(?:\.\w+)*="\s*([A-Za-z_$][\w$]*)\s*"/g)) add(m[1])
  for (const m of markup.matchAll(/\s(?:@|v-on:)[\w:.-]+="([^"]*)"/g))
    for (const a of m[1].matchAll(/(?:^|[;({,\s])([A-Za-z_$][\w$]*)\s*(?:\+\+|--|(?:[-+*/%]|&&|\|\||\?\?)?=(?![=>]))/g))
      add(a[1])
  return out
}

/** Translate a Vue docs snippet into its Solid equivalent. */
export function toSolidCode(vueCode: string): string {
  const kind = snippetKind(vueCode)
  if (kind !== "sfc" && kind !== "fragment") return vueCode

  // The snippet's two halves: a file's script and markup, or a fragment's
  // loose script lines and the markup under them.
  const setup = SETUP.exec(vueCode)
  const afterSetup = setup
    ? `${vueCode.slice(0, setup.index)}${vueCode.slice(setup.index + setup[0].length)}`.trim()
    : vueCode
  const template = TEMPLATE.exec(afterSetup.trim())
  const file = !!setup || !!template
  let script = setup?.[1] ?? ""
  let markup = template
    ? template[1]
        .split("\n")
        .map((l) => (l.startsWith("  ") ? l.slice(2) : l))
        .join("\n")
    : afterSetup
  let gap = ""
  if (!file) {
    const lines = vueCode.split("\n")
    const at = lines.findIndex((l) => l.trim().startsWith("<"))
    script = lines.slice(0, at).join("\n")
    markup = lines.slice(at).join("\n")
    gap = /\s*$/.exec(script)![0]
    script = script.slice(0, script.length - gap.length)
    if (at > 0) gap += "\n"
  }

  const comments: string[] = []
  markup = markup.replace(/<!--([\s\S]*?)-->/g, (_, text: string) => {
    comments.push(
      text
        .trim()
        .replace(/\bv-model\b/g, "modelValue")
        .replace(/\*\//g, "* /"),
    )
    return `\uE000${comments.length - 1}\uE000`
  })

  const names = declared(script)
  const imported = new Set(
    [...script.matchAll(/import\s*\{([^}]*)\}/g)].flatMap((m) => m[1].split(",").map((s) => s.trim())),
  )
  const env: Env = {
    signals: new Set([...names.signals, ...inferred(markup, new Set([...names.any, ...imported]))]),
    memos: names.memos,
    stores: names.stores,
    renames: new Map(),
    script: false,
  }

  const jsx = new Writer(comments).nodes(parse(markup), env)
  const lines = script.split("\n")
  const imports: string[] = []
  const body: string[] = []
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*import\b/.test(lines[i])) {
      body.push(lines[i])
      continue
    }
    // an import runs to the line that names its module
    let statement = lines[i]
    while (!/["'][^"']+["'];?\s*$/.test(statement) && i + 1 < lines.length) statement += `\n${lines[++i]}`
    if (!/from\s*["']vue["']/.test(statement)) imports.push(statement.trim())
  }
  const own = closeWatchers(scriptOf(body.join("\n").replace(/^\n+|\s+$/g, ""), env))

  if (!file) return `${own}${gap}${jsx}`

  // A file: its imports, then the component — the script's own lines as the
  // function's body, the markup as what it returns.
  const view = jsx.trim()
  const roots = parse(markup).filter((n) => !blank(n))
  const one = roots.length === 1 && isEl(roots[0])
  const returned = one ? { text: view, base: 0 } : fragment({ text: view, base: 0 })
  const inner = [
    own
      ? own
          .split("\n")
          .map((l) => (l.trim() ? `  ${l}` : ""))
          .join("\n")
      : "",
    `  return (\n    ${place(returned, 4)}\n  )`,
  ].filter(Boolean)
  const component = `export default function Example() {\n${inner.join("\n\n")}\n}`
  const head = [...solidImports(`${own}\n${view}`), ...imports]
  return `${head.length ? `${head.join("\n")}\n\n` : ""}${component}`
}
