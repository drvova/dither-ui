import type { PixelColor } from "@dither-kit"

export type PropSpec =
  | { key: string; kind: "text"; def: string }
  | { key: string; kind: "boolean"; def: boolean }
  | { key: string; kind: "number"; def: number; min?: number; max?: number; step?: number }
  | { key: string; kind: "select"; def: string; options: readonly string[] }
  | { key: string; kind: "color"; def: PixelColor }
  | { key: string; kind: "list"; def: string[] }

export type ComponentGroup = "inputs" | "navigation" | "display" | "overlays" | "structure"
export type ComponentDemo =
  | "alert"
  | "dialog"
  | "drawer"
  | "drawer-indent"
  | "field"
  | "fieldset"
  | "form"
  | "popover"
  | "preview-card"
  | "sidebar"
  | "swipe-area"
  | "tab-panel"
  | "toaster"
  | "toolbar"

export type ComponentEntry = {
  is: string
  label: string
  group: ComponentGroup
  frame: { w: number; h: number }
  props: PropSpec[]
  slotText?: string
  vmodel?: { def: unknown; prop?: string; event?: string }
  mapProps?: (p: Record<string, unknown>) => Record<string, unknown>
  demo?: ComponentDemo
}

const color = (def: PixelColor = "blue"): PropSpec => ({ key: "color", kind: "color", def })
const bool = (key: string, def = false): PropSpec => ({ key, kind: "boolean", def })
const text = (key: string, def: string): PropSpec => ({ key, kind: "text", def })
const number = (key: string, def: number, min?: number, max?: number, step?: number): PropSpec => ({ key, kind: "number", def, min, max, step })
const select = (key: string, def: string, options: readonly string[]): PropSpec => ({ key, kind: "select", def, options })
const list = (key: string, def: string[]): PropSpec => ({ key, kind: "list", def })
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean)
const options = (v: unknown) => strList(v).map((label) => ({ value: label.toLowerCase().replace(/\s+/g, "-"), label }))
const optionProps = (p: Record<string, unknown>) => ({ ...p, options: options(p.options) })
const items = (labels: unknown) => strList(labels).map((label) => ({ label }))

export const COMPONENT_REGISTRY: ComponentEntry[] = [
  { is: "DitherSwitch", label: "Switch", group: "inputs", frame: { w: 160, h: 80 }, props: [color(), bool("disabled")], vmodel: { def: true } },
  { is: "DitherCheckbox", label: "Checkbox", group: "inputs", frame: { w: 180, h: 80 }, props: [color(), bool("disabled")], slotText: "Remember me", vmodel: { def: true } },
  { is: "DitherToggle", label: "Toggle", group: "inputs", frame: { w: 160, h: 80 }, props: [color(), bool("disabled")], slotText: "Bold", vmodel: { def: true } },
  { is: "DitherSlider", label: "Slider", group: "inputs", frame: { w: 280, h: 90 }, props: [color(), number("min", 0), number("max", 100), number("step", 1, 0.1, undefined, 0.1), bool("disabled")], vmodel: { def: 40 } },
  { is: "DitherInput", label: "Input", group: "inputs", frame: { w: 280, h: 90 }, props: [text("placeholder", "Type here…"), bool("invalid"), bool("disabled")], vmodel: { def: "" } },
  { is: "DitherTextarea", label: "Textarea", group: "inputs", frame: { w: 300, h: 150 }, props: [text("placeholder", "Write a note…"), number("rows", 4, 2, 12), select("resize", "vertical", ["none", "vertical", "horizontal", "both"]), bool("invalid"), bool("disabled")], vmodel: { def: "" } },
  { is: "DitherNumberField", label: "Number field", group: "inputs", frame: { w: 220, h: 90 }, props: [number("min", 0), number("max", 100), number("step", 1, 0.1, undefined, 0.1), bool("disabled")], vmodel: { def: 24 } },
  { is: "DitherOtpField", label: "OTP field", group: "inputs", frame: { w: 320, h: 90 }, props: [number("length", 6, 3, 8)], vmodel: { def: "" } },
  { is: "DitherSelect", label: "Select", group: "inputs", frame: { w: 280, h: 220 }, props: [color(), list("options", ["One", "Two", "Three"]), text("placeholder", "Select…"), bool("invalid"), bool("disabled")], vmodel: { def: "" }, mapProps: optionProps },
  { is: "DitherCombobox", label: "Combobox", group: "inputs", frame: { w: 280, h: 220 }, props: [color(), list("options", ["Kyoto", "Seoul", "Taipei"]), text("placeholder", "Search…"), bool("disabled")], vmodel: { def: "" }, mapProps: optionProps },
  { is: "DitherAutocomplete", label: "Autocomplete", group: "inputs", frame: { w: 280, h: 220 }, props: [list("suggestions", ["Area chart", "Avatar", "Button"]), text("placeholder", "Search…"), bool("disabled")], vmodel: { def: "" } },
  { is: "DitherRadioGroup", label: "Radio group", group: "inputs", frame: { w: 260, h: 160 }, props: [color(), text("label", "Choose one"), list("options", ["One", "Two", "Three"])], vmodel: { def: "one" }, mapProps: optionProps },
  { is: "DitherCheckboxGroup", label: "Checkbox group", group: "inputs", frame: { w: 260, h: 170 }, props: [color(), text("label", "Choose any"), list("options", ["One", "Two", "Three"])], vmodel: { def: ["one"] }, mapProps: optionProps },
  { is: "DitherToggleGroup", label: "Toggle group", group: "inputs", frame: { w: 300, h: 100 }, props: [color(), select("type", "single", ["single", "multiple"]), list("options", ["Bold", "Italic", "Underline"])], vmodel: { def: "bold" }, mapProps: optionProps },
  { is: "DitherTabs", label: "Tabs", group: "inputs", frame: { w: 340, h: 110 }, props: [color(), list("tabs", ["One", "Two", "Three"]), select("variant", "underline", ["underline", "segmented", "washed"]), select("orientation", "horizontal", ["horizontal", "vertical"])], vmodel: { def: "One" }, mapProps: (p) => ({ ...p, tabs: strList(p.tabs) }) },
  { is: "DitherTabPanel", label: "Tab panel", group: "structure", frame: { w: 340, h: 160 }, props: [text("value", "One")], slotText: "Panel content", demo: "tab-panel" },
  { is: "DitherAccordion", label: "Accordion", group: "inputs", frame: { w: 340, h: 240 }, props: [color(), list("items", ["First", "Second", "Third"]), select("type", "single", ["single", "multiple"])], vmodel: { def: "first" }, mapProps: (p) => ({ ...p, items: strList(p.items).map((title) => ({ value: title.toLowerCase().replace(/\s+/g, "-"), title, content: `${title} content` })) }) },
  { is: "DitherCollapsible", label: "Collapsible", group: "structure", frame: { w: 300, h: 150 }, props: [color(), text("title", "Details")], slotText: "Hidden content", vmodel: { def: true } },

  { is: "DitherBreadcrumb", label: "Breadcrumb", group: "navigation", frame: { w: 320, h: 70 }, props: [list("items", ["Home", "Components", "Button"]), text("separator", "/")], mapProps: (p) => ({ ...p, items: items(p.items) }) },
  { is: "DitherPagination", label: "Pagination", group: "navigation", frame: { w: 380, h: 80 }, props: [number("total", 12, 1, 100), number("siblings", 1, 0, 3)], vmodel: { def: 4, prop: "page", event: "update:page" } },
  { is: "DitherRating", label: "Rating", group: "inputs", frame: { w: 240, h: 90 }, props: [color("orange"), number("max", 5, 1, 10), number("size", 22, 12, 48), bool("readonly"), text("label", "Rating")], vmodel: { def: 3 } },
  { is: "DitherStepper", label: "Stepper", group: "navigation", frame: { w: 480, h: 130 }, props: [list("steps", ["Account", "Profile", "Done"]), number("current", 1, 0, 8)], mapProps: (p) => ({ ...p, steps: items(p.steps) }) },
  { is: "DitherTimeline", label: "Timeline", group: "display", frame: { w: 340, h: 250 }, props: [list("items", ["Created", "Reviewed", "Published"]), number("dotSize", 12, 6, 24)], mapProps: (p) => ({ ...p, items: strList(p.items).map((title, i) => ({ title, time: `${i + 9}:00`, body: `${title} event` })) }) },
  { is: "DitherNavMenu", label: "Navigation menu", group: "navigation", frame: { w: 360, h: 90 }, props: [color(), list("items", ["Overview", "Components", "Examples"])], vmodel: { def: "Overview" }, mapProps: (p) => ({ ...p, items: items(p.items) }) },

  { is: "DitherBadge", label: "Badge", group: "display", frame: { w: 160, h: 80 }, props: [color(), select("variant", "gradient", ["gradient", "solid", "dotted", "hatched"])], slotText: "beta" },
  { is: "DitherKbd", label: "Kbd", group: "display", frame: { w: 140, h: 80 }, props: [], slotText: "⌘K" },
  { is: "DitherProgress", label: "Progress", group: "display", frame: { w: 300, h: 80 }, props: [color(), number("value", 60, 0, 100), bool("indeterminate")] },
  { is: "DitherMeter", label: "Meter", group: "display", frame: { w: 300, h: 80 }, props: [number("value", 65, 0, 100), number("min", 0), number("max", 100)] },
  { is: "DitherSpinner", label: "Spinner", group: "display", frame: { w: 120, h: 90 }, props: [color(), number("size", 24, 8, 96)] },
  { is: "DitherAurora", label: "Aurora", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#5227FF", "#7CFF67", "#5227FF"]), number("amplitude", 1, 0, 3, 0.1), number("blend", 0.5, 0, 1, 0.05), number("speed", 0.5, 0, 3, 0.1), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("paused")] },
  { is: "DitherWaves", label: "Waves", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#5227FF", "#7CFF67"]), number("count", 14, 2, 40, 1), number("amplitude", 0.5, 0, 1.5, 0.05), number("frequency", 2, 0.5, 6, 0.1), number("speed", 0.5, 0, 3, 0.1), number("lineWidth", 0.18, 0.02, 0.5, 0.02), number("glow", 1.5, 0, 3, 0.1), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("mouseInteraction", true), number("mouseStrength", 0.6, 0, 2, 0.1), bool("paused")] },
  { is: "DitherSilk", label: "Silk", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#5227FF", "#7CFF67", "#5227FF"]), number("scale", 2, 0.4, 6, 0.1), number("speed", 0.5, 0, 3, 0.1), number("noiseIntensity", 1, 0, 3, 0.1), number("rotation", 0.6, 0, 3.14, 0.05), number("sharpness", 1.5, 0.5, 4, 0.1), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("paused")] },
  { is: "DitherPlasma", label: "Plasma", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#5227FF", "#7CFF67", "#FFD23D"]), number("scale", 1, 0.3, 4, 0.1), number("speed", 0.5, 0, 3, 0.1), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("paused")] },
  { is: "DitherLineWaves", label: "Line waves", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#3DA5FF", "#7CE0FF"]), number("count", 16, 2, 40, 1), number("amplitude", 0.5, 0, 1.5, 0.05), number("frequency", 2, 0.5, 8, 0.1), number("speed", 0.5, 0, 3, 0.1), number("lineWidth", 0.16, 0.02, 0.5, 0.02), number("glow", 1.5, 0, 3, 0.1), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("paused")] },
  { is: "DitherThreads", label: "Threads", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#5227FF", "#7CFF67"]), number("count", 22, 2, 60, 1), number("amplitude", 0.6, 0, 1.5, 0.05), number("distortion", 2, 0.2, 6, 0.1), number("speed", 0.5, 0, 3, 0.1), number("lineWidth", 0.14, 0.02, 0.5, 0.02), number("glow", 1.5, 0, 3, 0.1), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("paused")] },
  { is: "DitherDotGrid", label: "Dot grid", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#5227FF", "#7CFF67"]), number("gap", 26, 4, 80, 1), number("dotSize", 0.5, 0.1, 1, 0.05), number("speed", 0.5, 0, 3, 0.1), number("glow", 1.5, 0, 3, 0.1), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("mouseInteraction", true), number("mouseStrength", 1, 0, 3, 0.1), bool("paused")] },
  { is: "DitherRippleGrid", label: "Ripple grid", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#3DA5FF", "#7CE0FF", "#CFF6FF"]), number("gap", 26, 4, 80, 1), number("dotSize", 0.6, 0.1, 1, 0.05), number("frequency", 26, 4, 60, 1), number("speed", 0.5, 0, 3, 0.1), number("glow", 1.5, 0, 3, 0.1), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("paused")] },
  { is: "DitherIridescence", label: "Iridescence", group: "display", frame: { w: 320, h: 220 }, props: [number("scale", 2, 0.4, 6, 0.1), number("speed", 0.5, 0, 3, 0.1), number("saturation", 0.85, 0, 1, 0.05), number("brightness", 0.9, 0, 1, 0.05), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("paused")] },
  { is: "DitherPixelSnow", label: "Pixel snow", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#CFF6FF", "#7CE0FF"]), number("density", 30, 6, 100, 1), number("speed", 0.5, 0, 3, 0.1), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("paused")] },
  { is: "DitherBeams", label: "Beams", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#5227FF", "#7CFF67"]), number("count", 6, 1, 30, 1), number("angle", 0.6, 0, 3.14, 0.05), number("speed", 0.5, 0, 3, 0.1), number("sharpness", 3, 0.5, 8, 0.1), number("glow", 1.5, 0, 3, 0.1), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("paused")] },
  { is: "DitherGridMotion", label: "Grid motion", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#3DA5FF", "#7CE0FF"]), number("count", 14, 2, 60, 1), number("angle", 0.5, 0, 6.28, 0.05), number("speed", 0.5, 0, 3, 0.1), number("lineWidth", 0.06, 0.01, 0.4, 0.01), number("glow", 1.5, 0, 3, 0.1), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("paused")] },
  { is: "DitherGridScan", label: "Grid scan", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#27FF64", "#7CFF67"]), number("count", 16, 2, 60, 1), number("speed", 0.5, 0, 3, 0.1), number("lineWidth", 0.05, 0.01, 0.4, 0.01), number("scanWidth", 0.12, 0.02, 0.5, 0.02), number("glow", 1.5, 0, 3, 0.1), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("paused")] },
  { is: "DitherGridDistortion", label: "Grid distortion", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#5227FF", "#7CFF67"]), number("count", 14, 2, 60, 1), number("distortion", 1, 0, 4, 0.1), number("speed", 0.5, 0, 3, 0.1), number("lineWidth", 0.06, 0.01, 0.4, 0.01), number("glow", 1.5, 0, 3, 0.1), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("mouseInteraction", true), number("mouseStrength", 1, 0, 3, 0.1), bool("paused")] },
  { is: "DitherLightRays", label: "Light rays", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#FFD23D", "#FF8A3D"]), number("rayCount", 16, 2, 60, 1), number("speed", 0.4, 0, 3, 0.1), number("spread", 1.2, 0, 4, 0.1), number("falloff", 0.7, 0, 2, 0.05), number("glow", 1.5, 0, 3, 0.1), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("paused")] },
  { is: "DitherSideRays", label: "Side rays", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#3DA5FF", "#7CE0FF"]), select("side", "left", ["left", "right"]), number("rayCount", 12, 2, 60, 1), number("speed", 0.4, 0, 3, 0.1), number("spread", 1, 0, 4, 0.1), number("falloff", 0.6, 0, 2, 0.05), number("glow", 1.5, 0, 3, 0.1), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("paused")] },
  { is: "DitherLightPillar", label: "Light pillar", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#5227FF", "#7CFF67"]), number("count", 8, 1, 40, 1), number("speed", 0.5, 0, 3, 0.1), number("width", 0.4, 0.05, 1, 0.05), number("glow", 1.5, 0, 3, 0.1), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("paused")] },
  { is: "DitherSoftAurora", label: "Soft aurora", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#5227FF", "#7CFF67", "#A8FFB6"]), number("bands", 3, 1, 6, 1), number("amplitude", 1, 0, 3, 0.1), number("blend", 0.6, 0, 1, 0.05), number("speed", 0.4, 0, 3, 0.1), number("opacity", 1, 0, 1, 0.05), number("dither", 0.5, 0, 1, 0.1), bool("paused")] },
  { is: "DitherFaultyTerminal", label: "Faulty terminal", group: "display", frame: { w: 320, h: 200 }, props: [{ ...color("#ffffff"), key: "tint" }, number("scale", 1.5, 0.2, 4, 0.1), number("digitSize", 1.2, 0.5, 3, 0.1), number("scanlineIntensity", 1, 0, 2, 0.1), number("glitchAmount", 1, 0, 3, 0.1), number("flickerAmount", 1, 0, 2, 0.1), number("noiseAmp", 1, 0, 2, 0.1), number("chromaticAberration", 0, 0, 8, 1), number("curvature", 0, 0, 1, 0.05), number("dither", 0, 0, 1, 0.1), number("brightness", 1, 0, 2, 0.1), number("timeScale", 1, 0, 3, 0.1), bool("mouseReact", true), bool("pause")] },
  { is: "DitherFerrofluid", label: "Ferrofluid", group: "display", frame: { w: 320, h: 220 }, props: [list("colors", ["#27FF64", "#7CFF67", "#A8FFB6"]), number("speed", 0.5, 0, 3, 0.1), number("scale", 1.6, 0.4, 4, 0.1), number("turbulence", 1, 0, 3, 0.1), number("fluidity", 0.1, 0, 1, 0.05), number("rimWidth", 0.2, 0.02, 0.6, 0.02), number("sharpness", 2.5, 0.5, 6, 0.1), number("shimmer", 1.5, 0, 3, 0.1), number("glow", 2, 0, 4, 0.1), select("flowDirection", "down", ["up", "down", "left", "right"]), number("opacity", 1, 0, 1, 0.05), number("dither", 1, 0, 1, 0.1), bool("mouseInteraction", true), number("mouseStrength", 1, 0, 3, 0.1), bool("paused")] },
  { is: "DitherSkeleton", label: "Skeleton", group: "display", frame: { w: 300, h: 100 }, props: [] },
  { is: "DitherSeparator", label: "Separator", group: "display", frame: { w: 260, h: 60 }, props: [select("orientation", "horizontal", ["horizontal", "vertical"])] },
  { is: "DitherTooltip", label: "Tooltip", group: "overlays", frame: { w: 220, h: 100 }, props: [text("text", "Helpful detail"), number("delay", 0, 0, 1000)], slotText: "Hover or focus" },
  { is: "DitherPreviewCard", label: "Preview card", group: "overlays", frame: { w: 300, h: 180 }, props: [number("delay", 0, 0, 1000)], slotText: "Preview details", demo: "preview-card" },

  { is: "DitherMenu", label: "Menu", group: "overlays", frame: { w: 220, h: 180 }, props: [list("items", ["Copy", "Paste", "Delete"])], slotText: "Open menu", mapProps: (p) => ({ ...p, items: items(p.items) }) },
  { is: "DitherContextMenu", label: "Context menu", group: "overlays", frame: { w: 260, h: 140 }, props: [list("items", ["Copy", "Paste", "Delete"])], slotText: "Right-click this area", mapProps: (p) => ({ ...p, items: items(p.items) }) },
  { is: "DitherMenubar", label: "Menubar", group: "overlays", frame: { w: 360, h: 100 }, props: [list("menus", ["File", "Edit", "View"])], mapProps: (p) => ({ ...p, menus: strList(p.menus).map((label) => ({ label, items: [{ label: "Open" }, { label: "Settings" }] })) }) },
  { is: "DitherPopover", label: "Popover", group: "overlays", frame: { w: 280, h: 180 }, props: [select("align", "start", ["start", "center", "end"])], slotText: "Popover content", vmodel: { def: false, prop: "open", event: "close" }, demo: "popover" },
  { is: "DitherDialog", label: "Dialog", group: "overlays", frame: { w: 300, h: 150 }, props: [text("title", "Dialog title")], slotText: "Dialog content", vmodel: { def: false, prop: "open", event: "close" }, demo: "dialog" },
  { is: "DitherAlertDialog", label: "Alert dialog", group: "overlays", frame: { w: 300, h: 150 }, props: [text("title", "Delete item?"), text("description", "This action cannot be undone."), text("confirmLabel", "Delete"), text("cancelLabel", "Cancel"), bool("danger", true)], vmodel: { def: false, prop: "open", event: "cancel" }, demo: "alert" },
  { is: "DitherDrawer", label: "Drawer", group: "overlays", frame: { w: 300, h: 160 }, props: [select("side", "right", ["right", "left", "bottom"]), text("title", "Drawer"), bool("swipe", true), bool("modal", true), bool("dismissible", true)], slotText: "Drawer content", vmodel: { def: false, prop: "open", event: "close" }, demo: "drawer" },
  { is: "DitherSwipeArea", label: "Swipe area", group: "overlays", frame: { w: 300, h: 150 }, props: [select("side", "right", ["right", "left", "bottom"]), number("size", 24, 8, 64), number("threshold", 24, 8, 100), bool("disabled")], vmodel: { def: false }, demo: "swipe-area" },
  { is: "DitherToaster", label: "Toaster", group: "overlays", frame: { w: 260, h: 130 }, props: [color(), text("message", "Saved to project")], demo: "toaster" },

  { is: "DitherField", label: "Field", group: "structure", frame: { w: 300, h: 150 }, props: [text("label", "Email"), text("description", "We will never share it."), text("error", "")], demo: "field" },
  { is: "DitherFieldset", label: "Fieldset", group: "structure", frame: { w: 340, h: 190 }, props: [text("legend", "Account")], demo: "fieldset" },
  { is: "DitherForm", label: "Form", group: "structure", frame: { w: 340, h: 220 }, props: [], demo: "form" },
  { is: "DitherScrollArea", label: "Scroll area", group: "structure", frame: { w: 280, h: 200 }, props: [], slotText: "Scrollable content" },
  { is: "DitherToolbar", label: "Toolbar", group: "structure", frame: { w: 360, h: 100 }, props: [text("label", "Formatting")], demo: "toolbar" },
  { is: "DitherSidebar", label: "Sidebar", group: "structure", frame: { w: 300, h: 420 }, props: [text("label", "Project"), select("variant", "default", ["default", "floating", "inset", "washed"]), select("side", "left", ["left", "right"]), select("collapse", "rail", ["rail", "hide", "none"]), select("density", "default", ["default", "compact"]), bool("toggle", true), { ...color(), key: "washColor" }], vmodel: { def: false }, demo: "sidebar" },
  { is: "DitherSidebarItem", label: "Sidebar item", group: "structure", frame: { w: 300, h: 240 }, props: [text("label", "Dashboard"), bool("active", true), color(), text("badge", "3")], demo: "sidebar" },
  { is: "DitherSidebarGroup", label: "Sidebar group", group: "structure", frame: { w: 300, h: 260 }, props: [text("label", "Workspace")], demo: "sidebar" },
  { is: "DitherSidebarSub", label: "Sidebar sub", group: "structure", frame: { w: 300, h: 280 }, props: [text("label", "Projects")], vmodel: { def: true }, demo: "sidebar" },
  { is: "DitherDrawerIndent", label: "Drawer indent", group: "structure", frame: { w: 320, h: 180 }, props: [], slotText: "Indented application surface", vmodel: { def: false }, demo: "drawer-indent" },
]

export const componentEntry = (is: string): ComponentEntry | undefined =>
  COMPONENT_REGISTRY.find((e) => e.is === is)

export function defaultComponentProps(entry: ComponentEntry): Record<string, unknown> {
  return Object.fromEntries(entry.props.map((p) => [p.key, p.def]))
}

const isPlain = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

export function sanitizeComponentProps(entry: ComponentEntry, raw: unknown): Record<string, unknown> {
  const src = isPlain(raw) ? raw : {}
  const out: Record<string, unknown> = {}
  for (const spec of entry.props) {
    const v = src[spec.key]
    switch (spec.kind) {
      case "text":
        out[spec.key] = typeof v === "string" ? v : spec.def
        break
      case "boolean":
        out[spec.key] = typeof v === "boolean" ? v : spec.def
        break
      case "number": {
        let n = typeof v === "number" && Number.isFinite(v) ? v : spec.def
        if (spec.min != null) n = Math.max(spec.min, n)
        if (spec.max != null) n = Math.min(spec.max, n)
        out[spec.key] = n
        break
      }
      case "select":
        out[spec.key] = spec.options.includes(v as string) ? v : spec.def
        break
      case "color":
        out[spec.key] = typeof v === "string" || typeof v === "number" ? v : spec.def
        break
      case "list":
        out[spec.key] = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [...spec.def]
        break
    }
  }
  return out
}
