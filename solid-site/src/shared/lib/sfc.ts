// The Solid twin of the Vue site's `src/shared/lib/sfc.ts`: writing a Solid
// component file (`.tsx`) out of document values. A document arrives from
// files, links and agents, and the code it becomes is written into someone's
// project, so every value goes in as data, never as code: these are the only
// ways the code generators put a value into a component.

const unicode = (c: string) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`

/** A JS literal of any JSON value: `<`, `>`, `&` and `'` only ever occur
 * inside its strings, as unicode escapes, so nothing in it reads as a tag,
 * an entity or the end of a string to JSX or to the restyler. */
export const js = (v: unknown): string => JSON.stringify(v ?? null).replace(/[<>&'\u2028\u2029]/g, unicode)

/** An object key: bare when it is an identifier, quoted otherwise. */
export const key = (k: string): string => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : js(k))

/** `{ blur: 3, blend: "screen" }`. */
export const objectLiteral = (o: object): string =>
  `{ ${Object.entries(o)
    .map(([k, v]) => `${key(k)}: ${js(v)}`)
    .join(", ")} }`

/** What a JSX attribute string or JSX text may hold as written: no quote,
 * entity, brace, tag, backslash or control character. */
const MARKS = new Set([...`"'\`&{}<>\\`, "\u007f", "\u2028", "\u2029"])
const PLAIN = {
  test: (s: string): boolean => [...s].every((c) => c >= " " && !MARKS.has(c)),
}

/** A prop as a JSX attribute: plain words as a static string, `true` as the
 * bare name, anything else as an expression of its literal. A string that
 * is not plain words is a JS string in braces, never an attribute's text. */
export function prop(name: string, v: unknown): string {
  if (typeof v === "string") return PLAIN.test(v) ? `${name}="${v}"` : `${name}={${js(v)}}`
  if (v === true) return name
  if (Array.isArray(v)) return `${name}={[${v.map(js).join(", ")}]}`
  if (typeof v === "object" && v) return `${name}={${objectLiteral(v)}}`
  return `${name}={${js(v)}}`
}

/** JSX text: as it is when plain words that JSX keeps whole (no edge
 * spaces, which it trims), otherwise one expression of its literal, so
 * markup, entities and braces in it stay words. */
export const text = (s: string): string => (PLAIN.test(s) && s === s.trim() ? s : `{${js(s)}}`)

/** Words inside a block comment, which they cannot close. */
export const comment = (s: string): string => s.replace(/\*\//g, "* /")

/** A length in px from a document's number. */
export const px = (v: unknown): string => `${Number.isFinite(Number(v)) ? Number(v) : 0}px`

/** The file: its imports (the kit's names sorted as given, type names last),
 * what stands at module level, and one default-exported component whose
 * body is `setup` and whose view is `view` (written from column 0). */
export function componentFile(parts: {
  kit: string[]
  types?: string[]
  signals?: boolean
  module?: string[]
  setup?: string[]
  view: string
}): string {
  const names = [...parts.kit, ...(parts.types ?? []).map((t) => `type ${t}`)]
  const imports = [
    parts.signals ? `import { createSignal } from "solid-js"` : "",
    `import { ${names.join(", ")} } from "@dither-kit"`,
  ].filter(Boolean)
  const module = parts.module?.length ? `${parts.module.join("\n\n")}\n\n` : ""
  const setup = parts.setup?.length ? `${parts.setup.map((l) => `  ${l}`).join("\n")}\n` : ""
  const view = parts.view
    .split("\n")
    .map((l) => `    ${l}`)
    .join("\n")
  return `${imports.join("\n")}\n\n${module}export default function Frame() {\n${setup}  return (\n${view}\n  )\n}`
}
