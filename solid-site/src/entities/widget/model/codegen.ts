// The Solid twin of the Vue site's `src/entities/widget/model/codegen.ts`:
// a frame's widget as a Solid component file (`.tsx`), on the kit's Solid
// layer (props camelCase, a model as its prop and `on<Event>` callback, the
// slot as children, state as a signal).
import { boundProps, componentEntry, fieldLabel } from "@/entities/widget/model/registry"
import type { PixelBloomInput, WidgetModel } from "@/entities/widget/model/types"
import { comment, componentFile, js, prop, px, text } from "../../../shared/lib/sfc"
import { modelOf, SCOPED_CHILDREN } from "./model"

// Every document value reaches the file through `shared/lib/sfc`: as a JSX
// attribute, a JS literal or JSX text, never spliced raw.

const bloomAttr = (bloom: PixelBloomInput): string => (bloom === "off" ? "" : prop("bloom", bloom))

/** A component's non-default props as attributes (compared against the
 * registry's defaults), bound as the canvas binds them. */
function propAttrs(is: string, props: Record<string, unknown>): string[] {
  const entry = componentEntry(is)
  const bound = boundProps(is, props)
  return (entry?.props ?? [])
    .filter((spec) => !(entry?.field && spec.key === "label"))
    .filter((spec) => JSON.stringify(props[spec.key]) !== JSON.stringify(spec.def))
    .map((spec) => prop(spec.key, bound[spec.key]))
}

/** A model's signal and the attributes that bind a control to it. `n` tells
 * the signals of one file apart ("" when there is one). */
function modelBinding(is: string, value: unknown, n: number | "") {
  const model = modelOf(componentEntry(is))
  if (!model) return null
  const get = `value${n}`
  const set = `setValue${n}`
  return {
    signal: `const [${get}, ${set}] = createSignal(${js(value)})`,
    attrs: [`${model.prop}={${get}()}`, `${model.on}={${model.carries ? set : `() => ${set}(false)`}}`],
  }
}

const tagOf = (is: string, attrs: string[], slot: string | null | undefined): string => {
  const a = attrs.length ? ` ${attrs.join(" ")}` : ""
  if (slot == null) return `<${is}${a} />`
  // A scoped component's children are a function of its scope.
  return `<${is}${a}>${SCOPED_CHILDREN.has(is) ? `{() => ${js(slot)}}` : text(slot)}</${is}>`
}

/** A field's tag inside the DitherField that carries its label (the tag
 * alone without one), indented to sit at `pad`. */
function inField(label: string | null, tag: string, pad: string, cls = ""): string {
  return label ? `<DitherField ${prop("label", label)}${cls}>\n${pad}  ${tag}\n${pad}</DitherField>` : tag
}

function componentCode(w: Extract<WidgetModel, { kind: "component" }>): string {
  // Studio-only demo wrappers provide required parent context; exported code keeps
  // the public component and its editable props as the portable starting point.
  const model = modelBinding(w.is, w.model, "")
  const label = fieldLabel(w.is, w.props)
  return componentFile({
    kit: label ? ["DitherField", w.is].sort() : [w.is],
    signals: !!model,
    setup: model ? [model.signal] : [],
    view: inField(label, tagOf(w.is, [...(model?.attrs ?? []), ...propAttrs(w.is, w.props)], w.slotText), ""),
  })
}

const JUSTIFY: Record<string, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
}
const ALIGN: Record<string, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
}

function screenCode(w: Extract<WidgetModel, { kind: "screen" }>): string {
  const imports = new Set<string>()
  const signals: string[] = []
  const cellTag = (cell: Extract<WidgetModel, { kind: "screen" }>["rows"][0]["cells"][0]): string => {
    imports.add(cell.is)
    const model = modelBinding(cell.is, cell.model, signals.length + 1)
    if (model) signals.push(model.signal)
    const attrs = [...(model?.attrs ?? []), ...propAttrs(cell.is, cell.props)]
    const label = fieldLabel(cell.is, cell.props)
    if (label) imports.add("DitherField")
    // A labelled field grows as its DitherField; the field fills it.
    if (cell.grow) attrs.push(label ? `class="w-full"` : `class="flex-1"`)
    return inField(label, tagOf(cell.is, attrs, cell.slotText), "    ", label && cell.grow ? ` class="flex-1"` : "")
  }
  const rows = w.rows
    .map((row) => {
      const kids = row.cells.map((c) => `    ${cellTag(c)}`).join("\n")
      const cls = `flex ${ALIGN[row.align] ?? ALIGN.start} ${JUSTIFY[row.justify] ?? JUSTIFY.start}`
      return `  <div class="${cls}" style="gap: ${px(row.gap)}">\n${kids}\n  </div>`
    })
    .join("\n")
  return componentFile({
    kit: [...imports].sort(),
    signals: signals.length > 0,
    setup: signals,
    view: `<div class="flex flex-col" style="gap: ${px(w.gap)}; padding: ${px(w.padding)}">\n${rows}\n</div>`,
  })
}

/** A tag whose attributes stand one a line. */
const tall = (is: string, attrs: string[], pad = ""): string =>
  `${pad}<${is}\n${attrs.map((a) => `${pad}  ${a}`).join("\n")}\n${pad}/>`

/** A runnable component for a standalone widget, reflecting every non-default. */
export function widgetCode(w: WidgetModel, frame: { w: number; h: number }): string {
  if (w.kind === "component") return componentCode(w)
  if (w.kind === "screen") return screenCode(w)
  if (w.kind === "reel") {
    const film = (c: (typeof w.clips)[number]) =>
      [
        c.camera.length ? `camera over ${c.camera.length} keys` : "",
        c.callouts.length ? `${c.callouts.length} callout${c.callouts.length > 1 ? "s" : ""}` : "",
        c.chapter ? `chapter "${c.chapter.line}"` : "",
      ]
        .filter(Boolean)
        .map((part) => `; ${part}`)
        .join("")
    // A film's words may hold what would close the comment.
    return `/*
  A reel plays other frames in order with ordered-dither transitions. It has no
  component of its own: export it as a video (the Studio's "video" action or
  the video.export command) for one MP4 of the whole sequence.
${comment(`${w.clips.map((c, i) => `  ${i + 1}. ${c.id} — ${c.seconds}s, in by ${c.transition.kind}${c.transition.kind === "cut" ? "" : ` over ${c.transition.seconds}s`}${film(c)}`).join("\n")}${w.score ? `\n  Score: synthesized from the cut, seed ${w.score.seed}.` : ""}`)}
*/`
  }
  if (w.kind === "avatar") {
    const attrs: string[] = [prop("name", w.name), prop("size", Math.round(Math.min(frame.w, frame.h)))]
    if (w.source !== "seed" && w.pattern) {
      const on = w.pattern.on.map((v) => (v ? 1 : 0))
      const density = w.pattern.density.map((d) => Math.round(d * 100) / 100)
      attrs.push(prop("pattern", { on, density }))
    }
    if (!w.autoColor) attrs.push(prop("color", w.color))
    if (w.mirror !== "auto") attrs.push(prop("mirror", w.mirror))
    if (w.grid !== 8) attrs.push(prop("grid", w.grid))
    if (w.cellPx !== 4) attrs.push(prop("cellPx", w.cellPx))
    if (w.density !== 0) attrs.push(prop("density", w.density))
    if (w.offTier !== 0.35) attrs.push(prop("offTier", w.offTier))
    if (w.bloom !== "off") attrs.push(bloomAttr(w.bloom))
    if (!w.animate) attrs.push(prop("animate", false))
    if (w.animationDuration !== 600) attrs.push(prop("animationDuration", w.animationDuration))
    return componentFile({ kit: ["DitherAvatar"], view: tall("DitherAvatar", attrs) })
  }

  if (w.kind === "button") {
    const attrs: string[] = []
    if (w.color !== "blue") attrs.push(prop("color", w.color))
    if (w.variant !== "gradient") attrs.push(prop("variant", w.variant))
    if (w.cell !== 2) attrs.push(prop("cell", w.cell))
    if (w.bloom !== "off") attrs.push(bloomAttr(w.bloom))
    return componentFile({ kit: ["DitherButton"], view: tagOf("DitherButton", attrs, w.label) })
  }

  if (w.kind === "image") {
    const attrs: string[] = [prop("src", `${w.src.slice(0, 80)}${w.src.length > 80 ? "…" : ""}`)]
    if (w.alt) attrs.push(prop("alt", w.alt))
    if (w.cell !== 3) attrs.push(prop("cell", w.cell))
    if (w.focusY !== 0.5) attrs.push(prop("focusY", w.focusY))
    if (w.fade !== 0) attrs.push(prop("fade", w.fade))
    return componentFile({
      kit: ["DitherImage"],
      view: `<div class="h-64">\n${tall("DitherImage", attrs, "  ")}\n</div>`,
    })
  }

  const attrs: string[] = [prop("from", w.from)]
  if (w.twoTone) attrs.push(prop("to", w.to))
  if (w.direction !== "up") attrs.push(prop("direction", w.direction))
  if (w.cell !== 3) attrs.push(prop("cell", w.cell))
  if (w.opacity !== 1) attrs.push(prop("opacity", w.opacity))
  if (w.bloom !== "off") attrs.push(bloomAttr(w.bloom))
  return componentFile({
    kit: ["DitherGradient"],
    // Fills its nearest positioned ancestor.
    view: `<div class="relative h-64">\n  {/* Fills its nearest positioned ancestor. */}\n  <DitherGradient ${attrs.join(" ")} />\n</div>`,
  })
}
