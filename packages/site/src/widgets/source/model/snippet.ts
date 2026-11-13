// What a docs snippet is, before it is translated: the docs' snippets
// are authored once, in Vue's notation (template fragments and short-form
// SFCs), and the Solid a reader sees is translated from that. Here: a
// snippet's kind, and a fragment completed into the whole file the
// translator takes. What a preview is as files is `./files`.

const VUE_API =
  /\b(ref|reactive|computed|watch|watchEffect|shallowRef|toRef|toRefs|nextTick|onMounted|onBeforeUnmount|onUnmounted)\b/g
const SCRIPT_LINE = /^(import|export|const|let|var|function|async function|type|interface|\/\/)\b|^\/\//

/** The kind of a snippet: a Vue SFC as written, a template fragment
 * (optionally led by loose script lines), or another language. */
export function snippetKind(code: string): "sfc" | "fragment" | "ts" | "css" | "sh" {
  const t = code.trim()
  if (/^<(script|template)\b/m.test(t)) return "sfc"
  const first = t.split("\n").find((l) => l.trim()) ?? ""
  const markup = /^\s*</m.test(t)
  if (first.startsWith("<")) return "fragment"
  if (markup && SCRIPT_LINE.test(first.trim())) return "fragment"
  if (/^(#|\$ |npx |npm |pnpm |bun |yarn )/.test(first)) return "sh"
  if (/^(\/\*|[:.#@a-z-][^\n{;=()]*\{)/.test(first) && !SCRIPT_LINE.test(first)) return "css"
  return "ts"
}

/** A `<script setup>` block followed by loose markup (no `<template>`): the
 * docs' short form of a file, its script and the markup it renders. */
const SCRIPT_THEN_MARKUP = /^\s*<script setup[^>]*>\n?([\s\S]*?)<\/script>\s*(<(?!template\b)[\s\S]*)$/

/** The same short form the other way round: the markup first, its
 * `<script setup>` block after it. */
const MARKUP_THEN_SCRIPT = /^\s*(<(?!script\b|template\b)[\s\S]*?)\s*<script setup[^>]*>\n?([\s\S]*?)<\/script>\s*$/

/** Where a fragment's markup ends and loose script lines under it begin
 * (`<Tag />` and then `function onChange() {…}`, or "the engine alone"
 * after the component): the first script line after the last line that
 * opens a tag, once every tag and comment above it is closed. The lines
 * from there are script, not text of the template. `lines.length` when the
 * markup runs to the end. */
function scriptUnder(lines: string[], at: number): number {
  let last = at
  for (let i = at; i < lines.length; i++) if (lines[i].trim().startsWith("<")) last = i
  let start = last + 1
  while (start < lines.length && !lines[start].trim()) start++
  if (start >= lines.length || !SCRIPT_LINE.test(lines[start].trim())) return lines.length
  const above = lines.slice(at, start).join("\n").trimEnd()
  const closed = above.endsWith(">") && above.split("<!--").length === above.split("-->").length
  return closed ? start : lines.length
}

/** A Vue snippet as a complete SFC. A fragment's script lines over or
 * under its markup (if any), or the `<script setup>` block over or under
 * loose markup, become its
 * `<script setup>`, with the Vue APIs they call and the kit exports the file
 * uses imported (those it imports already left as written); the markup
 * becomes its `<template>`. */
export function asSfc(code: string, kitExports: ReadonlySet<string>): string {
  const block = SCRIPT_THEN_MARKUP.exec(code)
  if (block) return asSfc(`${block[1].trim()}\n\n${block[2]}`, kitExports)
  const under = MARKUP_THEN_SCRIPT.exec(code)
  if (under) return asSfc(`${under[2].trim()}\n\n${under[1]}`, kitExports)
  if (snippetKind(code) !== "fragment") return code
  const lines = code.replace(/^\n+|\s+$/g, "").split("\n")
  const at = lines.findIndex((l) => l.trim().startsWith("<"))
  const end = scriptUnder(lines, at)
  const script = [lines.slice(0, at), lines.slice(end)]
    .map((part) => part.join("\n").trim())
    .filter(Boolean)
    .join("\n\n")
  const markup = lines.slice(at, end)
  while (markup.length && !markup[markup.length - 1].trim()) markup.pop()
  const imported = (name: string) => new RegExp(`import\\s*\\{[^}]*\\b${name}\\b`).test(script)
  const used = new Set<string>()
  for (const m of markup.join("\n").matchAll(/<([A-Z][A-Za-z0-9]*)/g)) if (kitExports.has(m[1])) used.add(m[1])
  for (const m of code.matchAll(/\b([A-Za-z_]\w*)\s*\(/g)) if (kitExports.has(m[1])) used.add(m[1])
  for (const name of used) if (imported(name)) used.delete(name)
  const vue = [...new Set([...script.matchAll(VUE_API)].map((m) => m[1]))].filter((name) => !imported(name))
  const head = [
    vue.length ? `import { ${vue.join(", ")} } from "vue"` : "",
    used.size ? `import { ${[...used].join(", ")} } from "@dither-kit"` : "",
  ].filter(Boolean)
  const setup = [head.join("\n"), script].filter(Boolean).join("\n\n")
  const template = markup.map((l) => (l.trim() ? `  ${l}` : "")).join("\n")
  return `${setup ? `<script setup lang="ts">\n${setup}\n</script>\n\n` : ""}<template>\n${template}\n</template>`
}
