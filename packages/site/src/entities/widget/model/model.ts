// A registry component's model, as Solid binds it. The registry
// (`@/entities/widget/model/registry`, framework free) names a
// model by its event (`model`: a default, and a prop and an event where they
// are not `modelValue` and `update:modelValue`); this is the one place that
// reading becomes a prop and an `on<Event>` callback, for the canvas, the
// code export and the agent's registry alike.
import type { ComponentEntry } from "@/entities/widget/model/registry"

/** The callback prop an event's listener is: `update:modelValue` is
 * `onUpdateModelValue`, `close` is `onClose`. */
export const listenerOf = (event: string): string =>
  `on${event
    .split(/[:-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`

type ModelBinding = {
  /** What the control holds on a new frame. */
  default: unknown
  /** The prop that carries the value. */
  prop: string
  /** The callback prop the control calls. */
  on: string
  /** Whether that callback is handed the next value (an update), or only
   * says the control is done (a dialog's close, which sets it false). */
  carries: boolean
}

/** The component's own model, or null where it binds none (its demo's
 * state, kept as the row's `model`, is not the component's). */
export function modelOf(entry: ComponentEntry | undefined): ModelBinding | null {
  const m = entry?.model
  if (!m || "demo" in m) return null
  const event = m.event ?? "update:modelValue"
  return { default: m.def, prop: m.prop ?? "modelValue", on: listenerOf(event), carries: event.startsWith("update:") }
}

/** The kit components whose children are a function of their scope: a
 * frame's slot text reaches them as one, on
 * the canvas and in the code export. Held to the kit's own prop types by
 * `tests/site/codegen.spec.tsx`. */
export const SCOPED_CHILDREN: ReadonlySet<string> = new Set([
  "DitherClipboard",
  "DitherHoverArea",
  "DitherInView",
  "DitherPluralText",
])

/** A component's slot text as the children the canvas hands it. */
export const slotChildren = (is: string, text: string): string | (() => string) =>
  SCOPED_CHILDREN.has(is) ? () => text : text
