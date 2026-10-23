// The docs demos' Inspect mode (after Kobra's): what a pointed or pinned
// element measures, read from the live DOM. Pure helpers — DemoCard owns the
// overlay, the rulers and the events.

export type Box = { x: number; y: number; w: number; h: number }

export type Reading = {
  label: string
  box: Box
  font: string
  color: string
  background: string
  radius: string
  padding: string
  /** Padding and border widths in px, top right bottom left — the overlay
   * draws the padding band from them. */
  pad: number[]
  edge: number[]
}

/** A computed colour as hex — `#rrggbb`, `#rrggbbaa` when translucent,
 * `transparent` at alpha 0. Anything unparseable passes through. */
export function hex(c: string): string {
  const m = c.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/)
  if (!m) return c
  const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4])
  if (a === 0) return "transparent"
  const h = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0")
  return `#${h(+m[1])}${h(+m[2])}${h(+m[3])}${a < 1 ? h(a * 255) : ""}`
}

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

const px = (v: string) => v.replace(/(\d+(?:\.\d+)?)px/g, (_, n: string) => `${+parseFloat(n).toFixed(1)}`)
const sides = (cs: CSSStyleDeclaration, prop: (side: string) => string) =>
  ["top", "right", "bottom", "left"].map((side) => parseFloat(cs.getPropertyValue(prop(side))) || 0)

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
    pad: sides(cs, (side) => `padding-${side}`),
    edge: sides(cs, (side) => `border-${side}-width`),
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
