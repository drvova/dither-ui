// What the workbench reads off the live DOM: an element's box and computed
// style, its layout gaps, its text's lines and baselines, the colour behind
// it, its accessible role/name/states, and a stage-wide accessibility audit.
// Pure functions over Elements — the components own the overlay and events.
import { contrast, grade, hex, over, parseColor, type RGBA } from "./color"
import { bottom, right, type Box } from "./geometry"

export type Sides = [number, number, number, number]

export type Reading = {
  label: string
  box: Box
  font: string
  color: string
  background: string
  radius: string
  padding: string
  margin: string
  display: string
  /** Padding, border and margin widths in px, top right bottom left. */
  pad: Sides
  edge: Sides
  outer: Sides
  gaps: Box[]
}

const px = (v: string) => v.replace(/(-?\d+(?:\.\d+)?)px/g, (_, n: string) => `${+parseFloat(n).toFixed(1)}`)
const sides = (cs: CSSStyleDeclaration, prop: (side: string) => string): Sides =>
  ["top", "right", "bottom", "left"].map((side) => parseFloat(cs.getPropertyValue(prop(side))) || 0) as Sides

/** A short name for an element: its tag, its role when it has one, and its
 * accessible label when short. */
export function labelOf(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const role = el.getAttribute("role")
  const name = el.getAttribute("aria-label")
  return [tag, role && role !== tag ? `[${role}]` : "", name && name.length <= 24 ? ` “${name}”` : ""].join("")
}

/** The element's box in the frame's coordinates, rounded to whole px. */
export function boxOf(el: Element, frame: Element): Box {
  const r = el.getBoundingClientRect()
  const f = frame.getBoundingClientRect()
  return {
    x: Math.round(r.left - f.left),
    y: Math.round(r.top - f.top),
    w: Math.round(r.width),
    h: Math.round(r.height),
  }
}

const shown = (el: Element) => {
  const r = el.getBoundingClientRect()
  return r.width > 0 || r.height > 0
}

/** The bands between a flex or grid container's children: the space its
 * `gap` (or its distribution) leaves, across the content box. */
export function gapsOf(el: Element, frame: Element): Box[] {
  const cs = getComputedStyle(el)
  if (!/flex|grid/.test(cs.display)) return []
  const outer = boxOf(el, frame)
  const [pt, pr, pb, pl] = sides(cs, (s) => `padding-${s}`)
  const [bt, br, bb, bl] = sides(cs, (s) => `border-${s}-width`)
  const cb = {
    x: outer.x + bl + pl,
    y: outer.y + bt + pt,
    w: outer.w - bl - pl - br - pr,
    h: outer.h - bt - pt - bb - pb,
  }
  const kids = [...el.children].filter(shown).map((k) => boxOf(k, frame))
  const out: Box[] = []
  for (let i = 0; i + 1 < kids.length; i++) {
    const [a, b] = [kids[i], kids[i + 1]]
    const overlapY = Math.min(bottom(a), bottom(b)) > Math.max(a.y, b.y)
    const overlapX = Math.min(right(a), right(b)) > Math.max(a.x, b.x)
    if (b.x - right(a) >= 1 && overlapY) out.push({ x: right(a), y: cb.y, w: b.x - right(a), h: cb.h })
    else if (b.y - bottom(a) >= 1 && overlapX) out.push({ x: cb.x, y: bottom(a), w: cb.w, h: b.y - bottom(a) })
  }
  return out
}

export function readingOf(el: Element, frame: Element): Reading {
  const cs = getComputedStyle(el)
  const family = cs.fontFamily.split(",")[0]?.replace(/["']/g, "").trim() || "inherit"
  const lh = cs.lineHeight === "normal" ? "normal" : px(cs.lineHeight)
  return {
    label: labelOf(el),
    box: boxOf(el, frame),
    font: `${px(cs.fontSize)}/${lh} ${family} ${cs.fontWeight}`,
    color: hex(cs.color),
    background: hex(cs.backgroundColor),
    radius: px(cs.borderRadius) || "0",
    padding: px(cs.padding) || "0",
    margin: px(cs.margin) || "0",
    display: cs.display,
    pad: sides(cs, (s) => `padding-${s}`),
    edge: sides(cs, (s) => `border-${s}-width`),
    outer: sides(cs, (s) => `margin-${s}`),
    gaps: gapsOf(el, frame),
  }
}

/** Walk the inspected tree without leaving `root`: up to the parent, down to
 * the first child, across to the next or previous sibling. */
export function walk(el: Element, root: Element, dir: "up" | "down" | "next" | "prev"): Element | null {
  const next =
    dir === "up"
      ? el.parentElement
      : dir === "down"
        ? el.firstElementChild
        : dir === "next"
          ? el.nextElementSibling
          : el.previousElementSibling
  return next && next !== root && root.contains(next) ? next : null
}

/** The child-index path from `root` to `el` — how a comment finds its
 * element again after a re-render. */
export function pathOf(el: Element, root: Element): number[] {
  const path: number[] = []
  for (let n: Element | null = el; n && n !== root; n = n.parentElement) {
    const parent: Element | null = n.parentElement
    if (!parent) return []
    path.unshift([...parent.children].indexOf(n))
  }
  return path
}

export function resolvePath(root: Element, path: number[]): Element | null {
  let n: Element | null = root
  for (const i of path) n = n?.children[i] ?? null
  return n === root ? null : n
}

/** A readable CSS path from `root` to `el` (tags with :nth-of-type where a
 * sibling shares the tag, ids, and an accessible label on the target). */
export function selectorOf(el: Element, root: Element): string {
  const parts: string[] = []
  for (let n: Element | null = el; n && n !== root; n = n.parentElement) {
    let part = n.tagName.toLowerCase()
    if (n.id && /^[a-z][\w-]*$/i.test(n.id)) part += `#${n.id}`
    else {
      const same = n.parentElement ? [...n.parentElement.children].filter((c) => c.tagName === n!.tagName) : []
      if (same.length > 1) part += `:nth-of-type(${same.indexOf(n) + 1})`
    }
    parts.unshift(part)
  }
  const name = el.getAttribute("aria-label")
  if (name && parts.length) parts[parts.length - 1] += `[aria-label="${name.replace(/"/g, '\\"')}"]`
  return parts.join(" > ")
}

const CSS_PROPS: [string, (v: string, cs: CSSStyleDeclaration) => boolean][] = [
  ["display", (v) => v !== "inline"],
  ["flex-direction", (v, cs) => /flex/.test(cs.display) && v !== "row"],
  ["align-items", (v, cs) => /flex|grid/.test(cs.display) && v !== "normal"],
  ["justify-content", (v, cs) => /flex|grid/.test(cs.display) && v !== "normal"],
  ["gap", (v, cs) => /flex|grid/.test(cs.display) && v !== "normal"],
  ["grid-template-columns", (v, cs) => /grid/.test(cs.display) && v !== "none"],
  ["position", (v) => v !== "static"],
  ["width", () => true],
  ["height", () => true],
  ["padding", (v) => v !== "0px"],
  ["margin", (v) => v !== "0px"],
  ["border", (v) => !/^0px/.test(v)],
  ["border-radius", (v) => v !== "0px"],
  ["background-color", (v) => parseColor(v)?.a !== 0],
  ["background-image", (v) => v !== "none"],
  ["color", () => true],
  ["font-family", () => true],
  ["font-size", () => true],
  ["font-weight", () => true],
  ["line-height", () => true],
  ["letter-spacing", (v) => v !== "normal"],
  ["text-transform", (v) => v !== "none"],
  ["opacity", (v) => v !== "1"],
  ["box-shadow", (v) => v !== "none"],
  ["transform", (v) => v !== "none"],
]

/** The element's computed look as a CSS block a reader can paste: the
 * layout, box, colour and type properties that differ from the defaults,
 * colours in hex. */
export function cssOf(el: Element): string {
  const cs = getComputedStyle(el)
  const lines = CSS_PROPS.flatMap(([prop, keep]) => {
    const raw = cs.getPropertyValue(prop)
    if (!raw || !keep(raw, cs)) return []
    const value = /color$/.test(prop) ? hex(raw) : raw
    return [`  ${prop}: ${value};`]
  })
  return `${labelOf(el).split(/[[\s“]/)[0]} {\n${lines.join("\n")}\n}`
}

// --- type -----------------------------------------------------------------

export type TypeReading = {
  family: string
  /** The family in the stack the browser actually draws with. */
  rendered: string
  size: number
  weight: string
  lineHeight: string
  letterSpacing: string
  transform: string
  color: RGBA | null
  background: RGBA | null
  ratio: number | null
  large: boolean
  lines: Box[]
  baselines: number[]
  /** Characters per line, averaged over the full lines. */
  measure: number
}

const GENERIC = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "math",
  "emoji",
])
let probe: CanvasRenderingContext2D | null | undefined

function context2d(): CanvasRenderingContext2D | null {
  if (probe === undefined) {
    try {
      probe = document.createElement("canvas").getContext("2d")
    } catch {
      probe = null
    }
  }
  return probe
}

/** The first family in a CSS font stack that is really there: a generic
 * family, or a named face whose glyphs measure apart from two fallbacks. */
export function renderedFamily(stack: string): string {
  const families = stack.split(",").map((f) => f.trim().replace(/^["']|["']$/g, ""))
  const ctx = context2d()
  for (const f of families) {
    if (GENERIC.has(f)) return f
    if (!ctx) continue
    const text = "mmmmmmmmmlli1WQ@#"
    const widths = ["monospace", "serif"].map((fallback) => {
      ctx.font = `72px ${fallback}`
      const base = ctx.measureText(text).width
      ctx.font = `72px "${f}", ${fallback}`
      return Math.abs(ctx.measureText(text).width - base) > 0.5
    })
    if (widths.some(Boolean)) return f
  }
  return families[families.length - 1] ?? stack
}

/** The colour actually behind an element: its and its ancestors'
 * backgrounds laid over each other until one is opaque; null when an image
 * or gradient sits in the way (the colour is not knowable from styles). */
export function backgroundBehind(el: Element): RGBA | null {
  let acc: RGBA = { r: 0, g: 0, b: 0, a: 0 }
  for (let n: Element | null = el; n; n = n.parentElement) {
    const cs = getComputedStyle(n)
    if (cs.backgroundImage !== "none") return null
    const c = parseColor(cs.backgroundColor)
    if (c && c.a > 0) {
      acc = acc.a === 0 ? c : over(acc, c)
      if (acc.a >= 0.999) return { ...acc, a: 1 }
    }
  }
  const page = parseColor(getComputedStyle(document.documentElement).backgroundColor)
  return over(acc, page && page.a > 0 ? page : { r: 255, g: 255, b: 255, a: 1 })
}

const hasOwnText = (el: Element) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())

/** The nearest element at or above `el` that holds text of its own. */
export function textHolder(el: Element, root: Element): Element | null {
  for (let n: Element | null = el; n && n !== root && root.contains(n); n = n.parentElement) if (hasOwnText(n)) return n
  return null
}

/** One box per rendered line of the element's own text. */
export function lineBoxes(el: Element, frame: Element): Box[] {
  const f = frame.getBoundingClientRect()
  const rects: DOMRect[] = []
  for (const node of el.childNodes) {
    if (node.nodeType !== 3 || !node.textContent!.trim()) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    rects.push(...range.getClientRects())
  }
  const lines: Box[] = []
  for (const r of rects.sort((a, b) => a.top - b.top || a.left - b.left)) {
    if (r.width < 1) continue
    const line = lines.find((l) => Math.abs(l.y - (r.top - f.top)) < 3)
    if (line) {
      const x2 = Math.max(line.x + line.w, r.right - f.left)
      line.x = Math.min(line.x, r.left - f.left)
      line.w = x2 - line.x
    } else lines.push({ x: r.left - f.left, y: r.top - f.top, w: r.width, h: r.height })
  }
  return lines.map((l) => ({ x: Math.round(l.x), y: Math.round(l.y), w: Math.round(l.w), h: Math.round(l.h) }))
}

export function typeOf(el: Element, frame: Element): TypeReading {
  const cs = getComputedStyle(el)
  const size = parseFloat(cs.fontSize)
  const weight = cs.fontWeight
  const lines = lineBoxes(el, frame)
  const ctx = context2d()
  let ascent = size * 0.8
  let descent = size * 0.2
  if (ctx) {
    ctx.font = `${weight} ${size}px ${cs.fontFamily}`
    const m = ctx.measureText("Hg")
    if (m.fontBoundingBoxAscent) {
      ascent = m.fontBoundingBoxAscent
      descent = m.fontBoundingBoxDescent
    }
  }
  const baselines = lines.map((l) => Math.round(l.y + (ascent * l.h) / (ascent + descent)))
  const color = parseColor(cs.color)
  const background = backgroundBehind(el)
  const large = size >= 24 || (size >= 18.66 && parseInt(weight) >= 700)
  const text = el.textContent?.replace(/\s+/g, " ").trim() ?? ""
  // Characters in the widest line, from the text's share of the total width.
  const total = lines.reduce((sum, l) => sum + l.w, 0)
  const measure = total ? Math.round((text.length * Math.max(...lines.map((l) => l.w))) / total) : 0
  return {
    family: cs.fontFamily,
    rendered: renderedFamily(cs.fontFamily),
    size,
    weight,
    lineHeight: cs.lineHeight === "normal" ? "normal" : px(cs.lineHeight),
    letterSpacing: cs.letterSpacing === "normal" ? "normal" : px(cs.letterSpacing),
    transform: cs.textTransform,
    color,
    background,
    ratio: color && background ? Math.round(contrast(color, background) * 100) / 100 : null,
    large,
    lines,
    baselines,
    measure,
  }
}

// --- accessibility --------------------------------------------------------

const INPUT_ROLES: Record<string, string> = {
  checkbox: "checkbox",
  radio: "radio",
  range: "slider",
  number: "spinbutton",
  search: "searchbox",
  button: "button",
  submit: "button",
  reset: "button",
  image: "button",
}

const TAG_ROLES: Record<string, string> = {
  button: "button",
  select: "combobox",
  textarea: "textbox",
  nav: "navigation",
  main: "main",
  aside: "complementary",
  form: "form",
  table: "table",
  ul: "list",
  ol: "list",
  li: "listitem",
  dialog: "dialog",
  progress: "progressbar",
  meter: "meter",
  output: "status",
  summary: "button",
  details: "group",
  fieldset: "group",
  hr: "separator",
  option: "option",
  article: "article",
}

/** The element's role: its `role` attribute, else the one HTML implies. */
export function roleOf(el: Element): string | null {
  const explicit = el.getAttribute("role")?.split(/\s+/)[0]
  if (explicit) return explicit
  const tag = el.tagName.toLowerCase()
  if (tag === "a") return el.hasAttribute("href") ? "link" : null
  if (tag === "input") return INPUT_ROLES[(el as HTMLInputElement).type] ?? "textbox"
  if (tag === "img") return el.getAttribute("alt") === "" ? "presentation" : "img"
  if (/^h[1-6]$/.test(tag)) return "heading"
  if (tag === "section") return el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby") ? "region" : null
  return TAG_ROLES[tag] ?? null
}

const NAME_FROM_CONTENT = new Set([
  "button",
  "link",
  "heading",
  "tab",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "checkbox",
  "radio",
  "switch",
  "cell",
  "columnheader",
  "rowheader",
  "tooltip",
  "treeitem",
])

function visibleText(el: Element): string {
  if (el.getAttribute("aria-hidden") === "true") return ""
  let out = ""
  for (const n of el.childNodes) {
    if (n.nodeType === 3) out += n.textContent
    else if (n.nodeType === 1) {
      const e = n as Element
      out += e.tagName.toLowerCase() === "img" ? (e.getAttribute("alt") ?? "") : visibleText(e)
    }
  }
  return out
}

/** The accessible name, by the common steps of the accname algorithm:
 * aria-labelledby, aria-label, a label element, alt / <title>, content for
 * roles named by their content, then title / placeholder. */
export function nameOf(el: Element): string {
  const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim()
  const by = el.getAttribute("aria-labelledby")
  if (by) {
    const text = by
      .split(/\s+/)
      .map((id) => document.getElementById(id))
      .map((n) => (n ? visibleText(n) : ""))
      .join(" ")
    if (clean(text)) return clean(text)
  }
  const aria = clean(el.getAttribute("aria-label"))
  if (aria) return aria
  const labels = (el as HTMLInputElement).labels
  if (labels?.length) {
    const text = clean([...labels].map((l) => visibleText(l)).join(" "))
    if (text) return text
  }
  const tag = el.tagName.toLowerCase()
  if (tag === "img") return clean(el.getAttribute("alt"))
  if (tag === "svg") return clean(el.querySelector(":scope > title")?.textContent)
  const role = roleOf(el)
  if (role && NAME_FROM_CONTENT.has(role)) {
    const text = clean(visibleText(el))
    if (text) return text
  }
  return clean(el.getAttribute("title")) || clean(el.getAttribute("placeholder"))
}

const STATE_ATTRS = [
  "aria-pressed",
  "aria-expanded",
  "aria-checked",
  "aria-selected",
  "aria-current",
  "aria-disabled",
  "aria-invalid",
  "aria-busy",
  "aria-haspopup",
  "aria-valuenow",
  "aria-level",
]

/** The states a screen reader announces, as `name=value` strings. */
export function statesOf(el: Element): string[] {
  const out = STATE_ATTRS.filter((a) => el.hasAttribute(a)).map((a) => `${a.slice(5)}=${el.getAttribute(a)}`)
  const input = el as HTMLInputElement
  if ((input.type === "checkbox" || input.type === "radio") && !el.hasAttribute("aria-checked"))
    out.push(`checked=${input.checked}`)
  if (input.disabled) out.push("disabled")
  if (input.required) out.push("required")
  if (/^h[1-6]$/i.test(el.tagName) && !el.hasAttribute("aria-level")) out.push(`level=${el.tagName[1]}`)
  return out
}

const TABBABLE =
  'a[href],button,input,select,textarea,summary,iframe,[tabindex],[contenteditable="true"],audio[controls],video[controls]'

const INTERACTIVE_ROLES = new Set([
  "button",
  "link",
  "checkbox",
  "radio",
  "switch",
  "tab",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "slider",
  "spinbutton",
  "textbox",
  "searchbox",
  "combobox",
  "treeitem",
])

export function interactive(el: Element): boolean {
  const role = roleOf(el)
  return el.matches(TABBABLE) || (!!role && INTERACTIVE_ROLES.has(role))
}

/** The control an element belongs to (a canvas or label inside a button
 * is the button), else the element itself — what a comment is about. */
export function controlOf(el: Element, root: Element): Element {
  for (let n: Element | null = el; n && n !== root && root.contains(n); n = n.parentElement)
    if (interactive(n)) return n
  return el
}

function hidden(el: Element): boolean {
  if (el.closest("[inert],[hidden],[aria-hidden='true']")) return true
  const cs = getComputedStyle(el)
  return cs.visibility === "hidden" || cs.display === "none" || !shown(el)
}

/** The Tab sequence inside `root`: positive tabindex first (ascending), then
 * document order; disabled, inert and hidden elements skipped. */
export function focusOrder(root: Element): Element[] {
  const all = [...root.querySelectorAll(TABBABLE)].filter(
    (el) => !(el as HTMLButtonElement).disabled && !hidden(el) && (el as HTMLElement).tabIndex >= 0,
  )
  const positive = all
    .filter((el) => (el as HTMLElement).tabIndex > 0)
    .sort((a, b) => (a as HTMLElement).tabIndex - (b as HTMLElement).tabIndex)
  return [...positive, ...all.filter((el) => (el as HTMLElement).tabIndex === 0)]
}

export type Issue = { el: Element; box: Box; kind: "name" | "target" | "contrast" | "alt" | "tabindex"; note: string }

/** The floor the site holds itself to, checked across a stage: every
 * control named, every target at least 24×24 (WCAG 2.5.8), text at AA
 * contrast where its background is knowable, images with alt, no positive
 * tabindex. */
export function audit(root: Element, frame: Element): Issue[] {
  const issues: Issue[] = []
  for (const el of root.querySelectorAll("*")) {
    if (hidden(el) || (el.closest("svg") !== null && el.tagName.toLowerCase() !== "svg")) continue
    const box = boxOf(el, frame)
    if (interactive(el)) {
      if (!nameOf(el)) issues.push({ el, box, kind: "name", note: `${labelOf(el)} has no accessible name` })
      const inlineLink = el.tagName === "A" && getComputedStyle(el).display === "inline"
      if (!inlineLink && (box.w < 24 || box.h < 24) && box.w > 0)
        issues.push({ el, box, kind: "target", note: `${labelOf(el)} is ${box.w}×${box.h}, under 24×24` })
      if ((el as HTMLElement).tabIndex > 0)
        issues.push({ el, box, kind: "tabindex", note: `${labelOf(el)} has tabindex=${(el as HTMLElement).tabIndex}` })
    }
    if (el.tagName === "IMG" && !el.hasAttribute("alt"))
      issues.push({ el, box, kind: "alt", note: "image without alt" })
    if (hasOwnText(el)) {
      const cs = getComputedStyle(el)
      const fg = parseColor(cs.color)
      const bg = backgroundBehind(el)
      if (fg && bg && parseFloat(cs.opacity) > 0) {
        const size = parseFloat(cs.fontSize)
        const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight) >= 700)
        const ratio = contrast(fg, bg)
        if (!grade(ratio, large).aa)
          issues.push({ el, box, kind: "contrast", note: `${labelOf(el)} text at ${ratio.toFixed(2)}:1` })
      }
    }
  }
  return issues
}
