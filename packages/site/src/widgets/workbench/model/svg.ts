// The overlay's one SVG layer, the parts that are not drawing: the width of
// a line of the mono face (labels are filled boxes sized to their text),
// a note's lines wrapped as the page would wrap them, and the annotations
// serialised as a standalone SVG file with every paint resolved.

/** The group of the layer that holds the annotations (arrows, strokes,
 * notes, comment pins): drawn by the overlay, serialised by the export. */
export const ANNOTATIONS = "wb-annotations"

/** A note wraps past this width, its padding left out (`Notes.css`'s field). */
const NOTE_MAX = 270
export const NOTE_PAD = 5
export const NOTE_LEADING = 1.35

/** The face's advance per px of size: the mono face's 0.6 until measured. */
let advance = 0.6
let measured = ""

/** Measure the face once per family (a canvas where there is one). */
export function measureFace(family: string): void {
  if (!family || measured === family || typeof document === "undefined") return
  measured = family
  const ctx = document.createElement("canvas").getContext?.("2d")
  if (!ctx) return
  ctx.font = `500 100px ${family}`
  const w = ctx.measureText("0000000000").width / 1000
  if (w > 0.3 && w < 1) advance = w
}

/** The width of `text` at `size` px in the overlay's mono face. */
export const textWidth = (text: string, size: number) => Math.ceil([...text].length * size * advance)

/** `text` broken into the lines a box `max` px wide shows: its own breaks
 * kept, words kept whole where they fit, a word longer than a line cut
 * anywhere (`pre-wrap`, `overflow-wrap: anywhere`). */
export function wrapLines(text: string, size: number, max = NOTE_MAX): string[] {
  const per = Math.max(1, Math.floor(max / (size * advance)))
  const out: string[] = []
  for (const para of text.split("\n")) {
    let line = ""
    for (const word of para.split(/(?<= )/)) {
      if ([...line].length + [...word.trimEnd()].length <= per) {
        line += word
        continue
      }
      if (line) out.push(line.trimEnd())
      let rest = [...word]
      while (rest.length > per) {
        out.push(rest.slice(0, per).join(""))
        rest = rest.slice(per)
      }
      line = rest.join("")
    }
    out.push(line.trimEnd())
  }
  return out
}

/** Every paint a drawing can carry, written out as attributes. */
const PAINT = [
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "opacity",
  "font-family",
  "font-size",
  "font-weight",
  "text-anchor",
  "dominant-baseline",
]

/** The group `g` as a standalone SVG file `w`×`h` in stage px: a clone
 * whose classes and data are dropped and whose computed paint (theme
 * colours, the settings' swatches) is written on the group whole and then
 * on each element where it differs from its parent's, so it reads the same
 * in any editor that opens it. Hidden parts are left out. */
export function serializeSvg(g: SVGGElement, w: number, h: number): string {
  const ns = "http://www.w3.org/2000/svg"
  const doc = g.ownerDocument
  const svg = doc.createElementNS(ns, "svg")
  svg.setAttribute("width", String(Math.round(w)))
  svg.setAttribute("height", String(Math.round(h)))
  svg.setAttribute("viewBox", `0 0 ${Math.round(w)} ${Math.round(h)}`)
  const view = doc.defaultView
  const copy = (from: Element, to: Element, parent: CSSStyleDeclaration | null) => {
    const css = view?.getComputedStyle(from) ?? null
    for (const name of [...to.getAttributeNames()])
      if (name === "class" || name === "style" || name.startsWith("data-") || name.startsWith("aria-"))
        to.removeAttribute(name)
    if (css)
      for (const prop of PAINT) {
        const v = css.getPropertyValue(prop).trim()
        // Opacity is the element's own (never inherited); the rest inherit.
        const around = prop === "opacity" ? "1" : parent?.getPropertyValue(prop).trim()
        if (v && v !== around) to.setAttribute(prop, v.replace(/(\d)px\b/g, "$1"))
        else to.removeAttribute(prop)
      }
    const kids = [...from.children]
    const copies = [...to.children]
    kids.forEach((k, i) => {
      if (css && view?.getComputedStyle(k).display === "none") copies[i].remove()
      else copy(k, copies[i], css)
    })
  }
  const clone = g.cloneNode(true) as SVGGElement
  copy(g, clone, null)
  svg.append(clone)
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}\n`
}
