// The chart family's shared types: what a root publishes to its parts, its
// canvas and its paint loop. Framework-free; a binding (`solid/runtime/`)
// builds the values and provides them.

import type { ScaleLinear } from "d3-scale"
import type { BloomInput, DitherMatrix, EasingInput, VariantInput } from "./dither-paint"
import type { DitherColor, Seed } from "./palette"
import type { PieSlice, RadarAxis } from "./polar"
import type { StackType } from "./scales"

/** A live value a paint loop reads each frame. */
export type Box<T> = { readonly current: T }

/** An element's CSS pixel size. */
export type Dimensions = { width: number; height: number }

/** A single tooltip row — one series (cartesian/radar) or one slice (pie). */
export type TooltipItem = {
  name: string
  label: string
  value: number
  seed: Seed
  dimmed: boolean
}

/**
 * The minimal surface shared by every chart family, so `<Legend>` and
 * `<Tooltip>` work identically whether they sit in a cartesian, bar, or polar
 * root. Each root publishes one of these alongside its family-specific context.
 * The fields are live getters over the root's reactive state, so reading them in
 * a template/computed tracks reactively.
 */
export type CommonChart = {
  names: string[] // legend entries — series keys (cartesian) or slice names (pie)
  labelOf: (name: string) => string
  seedOf: (name: string) => Seed
  selectedDataKey: string | null
  selectDataKey: (key: string | null) => void
  /** Transient legend-hover emphasis — spotlights one series (others dim)
   * while the pointer rests on its legend entry. Selection still wins. */
  focusDataKey: string | null
  setFocusDataKey: (key: string | null) => void
  hoverIndex: number | null
  heading: (index: number, labelKey?: string) => string | null
  itemsAt: (index: number) => TooltipItem[]
  ready: boolean
  tooltipLeft: number // clamped px for the floating tooltip
  tooltipTop: number // px — follows the hovered node (cartesian) / cursor (polar)
}

/** Live series surface for markers — `seed`/`dimmed` are getters so `<Dot>` /
 * `<ActiveDot>` read the current selection state reactively. */
export type SeriesContextValue = {
  dataKey: string
  seed: Seed
  dimmed: boolean
}

/** Which chart root a part is composed under — drives the boundary guards. */
export type ChartType = "area" | "bar" | "line" | "pie" | "radar"

export type ChartConfig = Record<string, { label?: string; color: DitherColor | number | string }>

export type Margins = { top: number; right: number; bottom: number; left: number }

type Row = Record<string, unknown>

export type { AreaVariant, TextureConfig, VariantInput } from "./dither-paint"
export type StrokeVariant = "solid" | "dashed"
export type SeriesKind = "area" | "line" | "bar"

/** What each series part (<Area />, <Line />, <Bar />) registers so the canvas
 * knows which series to paint and how. */
export type SeriesSpec = {
  dataKey: string
  kind: SeriesKind
  variant: VariantInput
  strokeVariant: StrokeVariant
  opacity: number // 0–1 layer opacity, multiplied into every painted alpha
}

export type ChartContextValue = {
  chartType: ChartType
  config: ChartConfig
  configKeys: string[]
  data: Row[]
  dataLength: number
  stackType: StackType
  margins: Margins
  plot: { width: number; height: number }
  ready: boolean
  xCenter: (index: number) => number
  bandwidth: number
  indexAtX: (px: number) => number
  barSlot: (index: number, seriesIndex: number, seriesCount: number) => { x: number; width: number }
  y: ScaleLinear<number, number>
  bands: Record<string, [number, number][]>
  max: number
  selectedDataKey: string | null
  selectDataKey: (key: string | null) => void
  focusDataKey: string | null
  setFocusDataKey: (key: string | null) => void
  hoverIndex: number | null
  setHoverIndex: (index: number | null) => void
  markerIndex: number | null
  cursorX: number
  setCursorX: (px: number) => void
  isMouseInChart: boolean
  setMouseInChart: (over: boolean) => void
  hovered: boolean
  bloom: BloomInput
  bloomOnHover: boolean
  precompiled: string | undefined
  seed: number | undefined
  effect: number | undefined
  seriesSpecs: Record<string, SeriesSpec>
  registerSeries: (spec: SeriesSpec) => void
  unregisterSeries: (dataKey: string) => void
  animate: boolean
  animationDuration: number
  animationDelay: number
  easing: EasingInput
  sparkles: boolean
  hoverLift: boolean
  stagger: number
  cell: number
  sparkleDensity: number
  sparkleSpeed: number
  barGap: number
  barEdge: number
  glowSize: number
  hoverStrength: number
  dimOpacity: number
  crosshair: boolean
  revision: number
  entranceDone: boolean
  markEntranceDone: () => void
  seedOf: (key: string) => Seed
  /** A series' threshold matrix from its variant, through any `DitherScreen` around the chart. */
  matrixOf: (variant: VariantInput) => DitherMatrix
  common: CommonChart
}

export type PolarChartContextValue = {
  chartType: ChartType
  config: ChartConfig
  configKeys: string[]
  data: Row[]
  dataLength: number
  ready: boolean
  plot: { width: number; height: number }
  margins: Margins
  center: { x: number; y: number }
  outerRadius: number
  innerRadius: number
  animate: boolean
  animationDuration: number
  animationDelay: number
  easing: EasingInput
  hoverLift: boolean
  cell: number
  popOut: number
  rimWidth: number
  falloff: number
  hoverStrength: number
  dimOpacity: number
  startAngle: number // degrees clockwise from 12 o'clock (pie)
  rings: number // concentric frame rings (radar)
  revision: number
  bloom: BloomInput
  bloomOnHover: boolean
  precompiled: string | undefined
  seedOf: (key: string) => Seed
  /** A series' threshold matrix from its variant, through any `DitherScreen` around the chart. */
  matrixOf: (variant: VariantInput) => DitherMatrix
  variantOf: (key: string) => VariantInput
  registerVariant: (key: string, variant: VariantInput) => void
  unregisterVariant: (key: string) => void
  selectedDataKey: string | null
  selectDataKey: (key: string | null) => void
  focusDataKey: string | null
  setFocusDataKey: (key: string | null) => void
  hoverIndex: number | null
  setHoverIndex: (i: number | null) => void
  setCursor: (px: number, py: number) => void
  isMouseInChart: boolean
  setMouseInChart: (over: boolean) => void
  pie: PieSlice[] | null
  radar: { axes: RadarAxis[]; max: number } | null
  common: CommonChart
}
