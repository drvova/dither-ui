import type { PixelColor } from "@dither-kit"

/** One editable prop on a registered component — the generic inspector panel
 * renders a control per spec, so new components are data, not code. */
export type PropSpec =
  | { key: string; kind: "text"; def: string }
  | { key: string; kind: "boolean"; def: boolean }
  | { key: string; kind: "number"; def: number; min?: number; max?: number; step?: number }
  | { key: string; kind: "select"; def: string; options: readonly string[] }
  | { key: string; kind: "color"; def: PixelColor }
  | { key: string; kind: "list"; def: string[] } // comma-edited string list

export type ComponentEntry = {
  is: string // kit export name, e.g. "DitherSwitch"
  label: string
  group: "inputs" | "display"
  frame: { w: number; h: number }
  props: PropSpec[]
  /** Editable default-slot text (omit for components without a text slot). */
  slotText?: string
  /** v-model initial value (omit for components without one). */
  vmodel?: { def: unknown }
  /** Map edited props to the component's real prop shapes (lists → objects). */
  mapProps?: (p: Record<string, unknown>) => Record<string, unknown>
}

const color = (def: PixelColor = "blue"): PropSpec => ({ key: "color", kind: "color", def })
const bool = (key: string, def = false): PropSpec => ({ key, kind: "boolean", def })
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean)

export const COMPONENT_REGISTRY: ComponentEntry[] = [
  // --- inputs -----------------------------------------------------------
  {
    is: "DitherSwitch", label: "Switch", group: "inputs",
    frame: { w: 160, h: 80 }, props: [color(), bool("disabled")],
    vmodel: { def: true },
  },
  {
    is: "DitherCheckbox", label: "Checkbox", group: "inputs",
    frame: { w: 160, h: 80 }, props: [color(), bool("disabled")],
    vmodel: { def: true },
  },
  {
    is: "DitherToggle", label: "Toggle", group: "inputs",
    frame: { w: 160, h: 80 }, props: [color(), bool("disabled")],
    slotText: "Bold", vmodel: { def: true },
  },
  {
    is: "DitherSlider", label: "Slider", group: "inputs",
    frame: { w: 280, h: 90 },
    props: [
      color(),
      { key: "min", kind: "number", def: 0 },
      { key: "max", kind: "number", def: 100 },
      { key: "step", kind: "number", def: 1, min: 0.1, step: 0.1 },
      bool("disabled"),
    ],
    vmodel: { def: 40 },
  },
  {
    is: "DitherInput", label: "Input", group: "inputs",
    frame: { w: 280, h: 90 },
    props: [
      { key: "placeholder", kind: "text", def: "Type here…" },
      bool("invalid"), bool("disabled"),
    ],
    vmodel: { def: "" },
  },
  {
    is: "DitherSelect", label: "Select", group: "inputs",
    frame: { w: 280, h: 220 },
    props: [
      color(),
      { key: "options", kind: "list", def: ["One", "Two", "Three"] },
      { key: "placeholder", kind: "text", def: "Select…" },
      bool("disabled"),
    ],
    vmodel: { def: "" },
    mapProps: (p) => ({
      ...p,
      options: strList(p.options).map((s) => ({ value: s.toLowerCase(), label: s })),
    }),
  },
  {
    is: "DitherTabs", label: "Tabs", group: "inputs",
    frame: { w: 320, h: 90 },
    props: [color(), { key: "tabs", kind: "list", def: ["One", "Two", "Three"] }],
    vmodel: { def: "One" },
    mapProps: (p) => ({ ...p, tabs: strList(p.tabs) }),
  },
  {
    is: "DitherAccordion", label: "Accordion", group: "inputs",
    frame: { w: 320, h: 220 },
    props: [
      color(),
      { key: "items", kind: "list", def: ["First", "Second", "Third"] },
      { key: "type", kind: "select", def: "single", options: ["single", "multiple"] },
    ],
    vmodel: { def: "first" },
    mapProps: (p) => ({
      ...p,
      items: strList(p.items).map((s) => ({ value: s.toLowerCase(), title: s })),
    }),
  },
  // --- display ----------------------------------------------------------
  {
    is: "DitherBadge", label: "Badge", group: "display",
    frame: { w: 160, h: 80 },
    props: [
      color(),
      { key: "variant", kind: "select", def: "gradient", options: ["gradient", "solid", "dotted", "hatched"] },
    ],
    slotText: "beta",
  },
  {
    is: "DitherKbd", label: "Kbd", group: "display",
    frame: { w: 140, h: 80 }, props: [], slotText: "⌘K",
  },
  {
    is: "DitherProgress", label: "Progress", group: "display",
    frame: { w: 280, h: 80 },
    props: [
      color(),
      { key: "value", kind: "number", def: 60, min: 0, max: 100 },
      bool("indeterminate"),
    ],
  },
  {
    is: "DitherMeter", label: "Meter", group: "display",
    frame: { w: 280, h: 80 },
    props: [
      { key: "value", kind: "number", def: 65, min: 0, max: 100 },
      { key: "min", kind: "number", def: 0 },
      { key: "max", kind: "number", def: 100 },
    ],
  },
  {
    is: "DitherSpinner", label: "Spinner", group: "display",
    frame: { w: 120, h: 80 },
    props: [color(), { key: "size", kind: "number", def: 24, min: 8, max: 96 }],
  },
  {
    is: "DitherSkeleton", label: "Skeleton", group: "display",
    frame: { w: 280, h: 90 }, props: [],
  },
  {
    is: "DitherSeparator", label: "Separator", group: "display",
    frame: { w: 240, h: 60 },
    props: [{ key: "orientation", kind: "select", def: "horizontal", options: ["horizontal", "vertical"] }],
  },
]

export const componentEntry = (is: string): ComponentEntry | undefined =>
  COMPONENT_REGISTRY.find((e) => e.is === is)

/** Registry defaults → an editable props bag. */
export function defaultComponentProps(entry: ComponentEntry): Record<string, unknown> {
  return Object.fromEntries(entry.props.map((p) => [p.key, p.def]))
}
