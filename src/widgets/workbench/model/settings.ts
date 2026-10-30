// The workbench's preferences, one set for every preview (localStorage
// `dither-workbench-settings`). Colours are the theme's swatch tokens, so
// the overlay follows the theme and stays legible in both.
import { COLOR_FORMATS, type ColorFormat } from "./color"
import { readJson, writeJson } from "@/shared/lib/storage"

export const SWATCHES = ["orange", "purple", "pink", "green", "blue", "grey"] as const
export type Swatch = (typeof SWATCHES)[number]
export const swatch = (s: Swatch) => `var(--swatch-${s})`

export type Settings = {
  /** Boxes, ruler spans, chips. */
  highlight: Swatch
  /** Guides, grids and measured distances. */
  guide: Swatch
  /** New arrows and notes. */
  annotate: Swatch
  /** The pen in hand and each pen's own colour and width, kept as left. */
  pen: "ink" | "marker"
  inkSwatch: Swatch
  inkWidth: number
  markerSwatch: Swatch
  markerWidth: number
  /** What a colour sample copies. */
  format: ColorFormat
  /** Show padding, margin and gap bands under the inspected box. */
  layout: boolean
  /** Snap guides and arrow ends to element edges and other guides. */
  snap: boolean
  /** Keep every Alt measurement on screen until Escape, not only the last. */
  multiMeasure: boolean
  /** Keep each preview's annotations across visits. */
  persist: boolean
  /** Stills: render the DOM (no prompt) or grab the screen's exact pixels. */
  stills: "dom" | "screen"
  /** The edge of the stage the tray docks to. */
  tray: "bottom" | "top"
}

export const DEFAULT_SETTINGS: Settings = {
  highlight: "orange",
  guide: "purple",
  annotate: "orange",
  pen: "ink",
  inkSwatch: "orange",
  inkWidth: 3,
  markerSwatch: "purple",
  markerWidth: 14,
  format: "hex",
  layout: true,
  snap: true,
  multiMeasure: false,
  persist: true,
  stills: "dom",
  tray: "bottom",
}

const KEY = "dither-workbench-settings"

export function normalizeSettings(raw: unknown): Settings {
  const s = { ...DEFAULT_SETTINGS }
  if (typeof raw !== "object" || raw === null) return s
  const r = raw as Record<string, unknown>
  const sw = (v: unknown, d: Swatch) => (SWATCHES.includes(v as Swatch) ? (v as Swatch) : d)
  const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d)
  const width = (v: unknown, d: number, max: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(1, Math.round(v))) : d
  return {
    highlight: sw(r.highlight, s.highlight),
    guide: sw(r.guide, s.guide),
    annotate: sw(r.annotate, s.annotate),
    pen: r.pen === "marker" ? "marker" : "ink",
    inkSwatch: sw(r.inkSwatch, s.inkSwatch),
    inkWidth: width(r.inkWidth, s.inkWidth, 24),
    markerSwatch: sw(r.markerSwatch, s.markerSwatch),
    markerWidth: width(r.markerWidth, s.markerWidth, 48),
    format: COLOR_FORMATS.includes(r.format as ColorFormat) ? (r.format as ColorFormat) : s.format,
    layout: bool(r.layout, s.layout),
    snap: bool(r.snap, s.snap),
    multiMeasure: bool(r.multiMeasure, s.multiMeasure),
    persist: bool(r.persist, s.persist),
    stills: r.stills === "screen" ? "screen" : "dom",
    tray: r.tray === "top" ? "top" : "bottom",
  }
}

export const loadSettings = (): Settings => normalizeSettings(readJson(KEY))

export const saveSettings = (s: Settings): void => writeJson(KEY, s)
