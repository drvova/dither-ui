// What a docs snippet is: the docs' examples are written in Solid, most as
// a fragment (JSX, with the script it needs as loose lines over or under
// it), and the source panel shows each as the whole `.tsx` module a reader
// takes. Here: a snippet's kind, and a fragment completed into that module.
// What a preview is as files is `./files`.

/** A line of markup: a tag, or a comment of the markup. */
const MARKUP_LINE = /^[ \t]*(<|\{\/\*)/m
const SCRIPT_LINE = /^(import|export|const|let|var|function|async function|type|interface|\/\/)\b|^\/\//

/** The kind of a snippet: a whole Solid module (`export default` a
 * component), a fragment (JSX, optionally led or followed by loose script
 * lines), or another language. */
export type SnippetKind = "file" | "fragment" | "ts" | "css" | "sh"

export function snippetKind(code: string): SnippetKind {
  const t = code.trim()
  if (/^export default function\b/m.test(t) && /^\s*return \(/m.test(t)) return "file"
  const first = t.split("\n").find((l) => l.trim()) ?? ""
  const markup = MARKUP_LINE.test(t)
  if (MARKUP_LINE.test(first)) return "fragment"
  if (markup && SCRIPT_LINE.test(first.trim())) return "fragment"
  if (/^(#|\$ |npx |npm |pnpm |bun |yarn )/.test(first)) return "sh"
  if (/^(\/\*|[:.#@a-z-][^\n{;=()]*\{)/.test(first) && !SCRIPT_LINE.test(first)) return "css"
  return "ts"
}

/* ------------------------------ reading JSX ------------------------------- */

/** End (exclusive) of the string literal opened at `from`. */
function quoteEnd(code: string, from: number): number {
  for (let i = from + 1; i < code.length; i++) {
    if (code[i] === "\\") i++
    else if (code[i] === code[from]) return i + 1
  }
  return code.length
}

/** End (exclusive) of the template literal opened at `from`, its holes included. */
function templateEnd(code: string, from: number): number {
  for (let i = from + 1; i < code.length; i++) {
    if (code[i] === "\\") i++
    else if (code[i] === "$" && code[i + 1] === "{") i = scriptEnd(code, i + 1) - 1
    else if (code[i] === "`") return i + 1
  }
  return code.length
}

/** End (exclusive) of the script in the bracket opened at `from` (a JSX
 * expression, a call): strings, comments and the JSX inside it skipped. */
function scriptEnd(code: string, from: number): number {
  let depth = 0
  for (let i = from; i < code.length; i++) {
    const c = code[i]
    if (c === '"' || c === "'") i = quoteEnd(code, i) - 1
    else if (c === "`") i = templateEnd(code, i) - 1
    else if (c === "/" && code[i + 1] === "/") i = code.indexOf("\n", i) < 0 ? code.length : code.indexOf("\n", i)
    else if (c === "/" && code[i + 1] === "*") i = code.indexOf("*/", i) < 0 ? code.length : code.indexOf("*/", i) + 1
    else if (
      c === "<" &&
      /[A-Za-z>]/.test(code[i + 1] ?? "") &&
      /([([{,?:=&|!>]|\breturn)$/.test(code.slice(0, i).trimEnd())
    )
      i = elementEnd(code, i) - 1
    else if ("([{".includes(c)) depth++
    else if (")]}".includes(c) && --depth === 0) return i + 1
  }
  return code.length
}

/** End (exclusive) of the JSX element opened at `from`, its children included. */
function elementEnd(code: string, from: number): number {
  let depth = 0
  for (let i = from; i < code.length;) {
    let j = i + 1
    for (; j < code.length && code[j] !== ">"; j++) {
      if (code[j] === '"' || code[j] === "'") j = quoteEnd(code, j) - 1
      else if (code[j] === "{") j = scriptEnd(code, j) - 1
    }
    if (code[i + 1] === "/") depth--
    else if (code[j - 1] !== "/") depth++
    i = j + 1
    if (depth === 0) return i
    while (i < code.length && code[i] !== "<") i = code[i] === "{" ? scriptEnd(code, i) : i + 1
  }
  return code.length
}

/** A fragment's markup from `at`: where it ends (script lines under it
 * start there, or the code does) and whether it is one element. */
function markupOf(code: string, at: number): { end: number; one: boolean } {
  let elements = 0
  let other = 0
  let i = at
  while (i < code.length) {
    while (/\s/.test(code[i] ?? "")) i++
    if (i >= code.length) break
    if (code[i] === "<") {
      i = elementEnd(code, i)
      elements++
    } else if (code[i] === "{") {
      i = scriptEnd(code, i)
      other++
    } else if (/\n[ \t]*$/.test(code.slice(0, i)) && SCRIPT_LINE.test(code.slice(i).split("\n", 1)[0])) {
      return { end: i, one: elements === 1 && !other }
    } else {
      while (i < code.length && !"<{\n".includes(code[i])) i++
      other++
    }
  }
  return { end: code.length, one: elements === 1 && !other }
}

/* --------------------------- the whole module ----------------------------- */

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

/** Every line but the first moved `by` columns right (blank lines kept). */
const indent = (text: string, by: number) =>
  text
    .split("\n")
    .map((l, i) => (i === 0 || !l.trim() ? l : " ".repeat(by) + l))
    .join("\n")

/** A Solid fragment as the whole `.tsx` module a reader takes: its script
 * lines (over its markup, under it, or both) the component's body, with the
 * Solid APIs and the kit exports it uses imported (what it imports already
 * kept as written), its markup what the component returns (several nodes as
 * one fragment). Any other snippet is already whole and comes back as it is. */
export function asTsx(code: string, kitExports: ReadonlySet<string>): string {
  if (snippetKind(code) !== "fragment") return code
  const text = code.replace(/^\n+|\s+$/g, "")
  const at = MARKUP_LINE.exec(text)!.index
  const { end, one } = markupOf(text, at)
  const markup = text.slice(at, end).trim()
  const script = [text.slice(0, at), text.slice(end)]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n\n")
  // an import runs to the line that names its module
  const lines = script.split("\n")
  const imports: string[] = []
  const body: string[] = []
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*import\b/.test(lines[i])) {
      body.push(lines[i])
      continue
    }
    let statement = lines[i]
    while (!/["'][^"']+["'];?\s*$/.test(statement) && i + 1 < lines.length) statement += `\n${lines[++i]}`
    imports.push(statement.trim())
  }
  const own = body.join("\n").replace(/^\n+|\s+$/g, "")
  const imported = (name: string) => new RegExp(`import\\s*\\{[^}]*\\b${name}\\b`).test(script)
  const kit = new Set<string>()
  for (const m of markup.matchAll(/<([A-Z][A-Za-z0-9]*)/g)) if (kitExports.has(m[1])) kit.add(m[1])
  for (const m of code.matchAll(/\b([A-Za-z_]\w*)\s*\(/g)) if (kitExports.has(m[1])) kit.add(m[1])
  for (const name of kit) if (imported(name)) kit.delete(name)
  const solid = new Map<string, string[]>()
  for (const [name, re, from] of SOLID)
    if (re.test(`${own}\n${markup}`)) solid.set(from, [...(solid.get(from) ?? []), name])
  const head = [
    ...[...solid].map(([from, names]) => `import { ${names.join(", ")} } from "${from}"`),
    ...(kit.size ? [`import { ${[...kit].join(", ")} } from "@dither-kit"`] : []),
    ...imports,
  ]
  const view = one ? markup : markup.includes("\n") ? `<>\n  ${indent(markup, 2)}\n</>` : `<>${markup}</>`
  const inner = [
    own
      .split("\n")
      .map((l) => (l.trim() ? `  ${l}` : ""))
      .join("\n"),
    `  return (\n    ${indent(view, 4)}\n  )`,
  ].filter((part) => part.trim())
  const component = `export default function Example() {\n${inner.join("\n\n")}\n}`
  return `${head.length ? `${head.join("\n")}\n\n` : ""}${component}`
}
