// StyleX in the page, for Run. An app compiles StyleX with its bundler
// plugin; Run has no build, so this module does the plugin's work at run
// time for the API a reader's code uses (`create`, `attrs` for Vue, `props`,
// `defineVars`, `keyframes`, `firstThatWorks`): every property and condition
// becomes one atomic class (`x` + a hash of its rule), written once into a
// stylesheet in the head (rules under a condition after the plain ones, as
// StyleX orders them), and the last style to set a property wins.

export type StyleValue = string | number | null | undefined | readonly string[] | { [condition: string]: StyleValue }
export type Style = { [property: string]: StyleValue }
type Arg = Style | null | undefined | false | readonly Arg[]

// Properties StyleX passes as bare numbers; any other number is in px.
const UNITLESS = new Set([
  "aspectRatio",
  "flex",
  "flexGrow",
  "flexShrink",
  "fontWeight",
  "lineHeight",
  "opacity",
  "order",
  "scale",
  "zIndex",
  "zoom",
])

/** `backgroundColor` → `background-color`, `WebkitLineClamp` →
 * `-webkit-line-clamp`; custom properties stay as written. */
export function cssName(prop: string): string {
  if (prop.startsWith("--")) return prop
  return prop
    .replace(/^(webkit|moz|ms|Webkit|Moz|Ms)(?=[A-Z])/, (p) => `-${p.toLowerCase()}`)
    .replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
}

const cssValue = (prop: string, v: string | number) =>
  typeof v === "number" && v !== 0 && !UNITLESS.has(prop) && !prop.startsWith("--") ? `${v}px` : String(v)

/** FNV-1a, in base 36: a short stable name for a rule. */
export function hash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193)
  return (h >>> 0).toString(36)
}

const written = new Set<string>()
let sheets: { plain: HTMLStyleElement; conditional: HTMLStyleElement } | null = null

function write(id: string, css: string, conditional: boolean) {
  if (written.has(id) || typeof document === "undefined") return
  written.add(id)
  if (!sheets) {
    const make = (kind: string) => {
      const el = document.createElement("style")
      el.dataset.runStylex = kind
      document.head.append(el)
      return el
    }
    sheets = { plain: make("plain"), conditional: make("conditional") }
  }
  ;(conditional ? sheets.conditional : sheets.plain).append(`${css}\n`)
}

/** The rule for one declaration under its conditions: pseudo-classes and
 * pseudo-elements join the selector, at-rules wrap it. */
function rule(selector: string, path: string[], decl: string): string {
  const pseudo = path.filter((c) => c.startsWith(":")).join("")
  let css = `${selector}${pseudo}{${decl}}`
  for (const at of path.filter((c) => c.startsWith("@")).reverse()) css = `${at}{${css}}`
  return css
}

/** Each leaf of a value under its conditions; `default` is no condition. */
function leaves(value: StyleValue, path: string[], out: [string[], string | number | readonly string[]][]) {
  if (value === null || value === undefined) return out
  if (typeof value === "object" && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value as Record<string, StyleValue>))
      leaves(v, k === "default" ? path : [...path, k], out)
  } else out.push([path, value as string | number | readonly string[]])
  return out
}

const declOf = (prop: string, v: string | number | readonly string[]) => {
  const name = cssName(prop)
  // `firstThatWorks` fallbacks: every value, the first one last so it wins where it parses.
  return Array.isArray(v)
    ? [...v]
        .reverse()
        .map((x) => `${name}:${cssValue(prop, x)}`)
        .join(";")
    : `${name}:${cssValue(prop, v as string | number)}`
}

/** Namespaces of styles, returned as given: the work happens when they are applied. */
export function create<T extends Record<string, Style>>(namespaces: T): T {
  return namespaces
}

/** The class names for the styles given, in order (falsy ones skipped,
 * arrays flattened): the last style to set a property wins it. */
function classesOf(args: readonly Arg[]): string {
  const merged = new Map<string, StyleValue>()
  const visit = (a: Arg) => {
    if (!a) return
    if (Array.isArray(a)) return a.forEach(visit)
    for (const [prop, value] of Object.entries(a as Style)) {
      merged.delete(prop)
      merged.set(prop, value)
    }
  }
  args.forEach(visit)
  const names: string[] = []
  for (const [prop, value] of merged)
    for (const [path, v] of leaves(value, [], [])) {
      const decl = declOf(prop, v)
      const name = `x${hash(`${path.join("|")}{${decl}}`)}`
      write(name, rule(`.${name}`, path, decl), path.length > 0)
      names.push(name)
    }
  return names.join(" ")
}

/** Vue (and any DOM template): `v-bind="stylex.attrs(styles.a, on && styles.b)"`. */
export function attrs(...args: Arg[]): { class?: string } {
  const c = classesOf(args)
  return c ? { class: c } : {}
}

/** React's spelling of the same: `{...stylex.props(styles.a)}`. */
export function props(...args: Arg[]): { className?: string } {
  const c = classesOf(args)
  return c ? { className: c } : {}
}

/** Theme variables: each becomes a custom property on `:root` (its
 * conditions included), and the returned object reads them as `var()`s. */
export function defineVars<T extends Record<string, StyleValue>>(vars: T): { [K in keyof T]: string } {
  const out = {} as { [K in keyof T]: string }
  const id = hash(JSON.stringify(vars))
  for (const [key, value] of Object.entries(vars)) {
    const name = `--x${id}-${key}`
    for (const [path, v] of leaves(value, [], [])) {
      const decl = `${name}:${cssValue(name, v as string | number)}`
      write(`${name}|${path.join("|")}|${decl}`, rule(":root", path, decl), path.length > 0)
    }
    out[key as keyof T] = `var(${name})`
  }
  return out
}

/** An animation's frames as `@keyframes`; its name to use in `animationName`. */
export function keyframes(frames: Record<string, Style>): string {
  const body = Object.entries(frames)
    .map(
      ([at, style]) =>
        `${at}{${Object.entries(style)
          .map(([p, v]) => declOf(p, v as string | number))
          .join(";")}}`,
    )
    .join("")
  const name = `x${hash(body)}`
  write(name, `@keyframes ${name}{${body}}`, false)
  return name
}

/** Fallback values, the first that the browser supports winning. */
export function firstThatWorks(...values: string[]): readonly string[] {
  return values
}
