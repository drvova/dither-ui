import type { ChartType } from "@/shared/config"
import type {
  AreaVariant,
  BloomLevel,
  DitherColor,
  EasingInput,
  StackType,
  TooltipVariant,
} from "@dither-kit"

export type SeriesRow = {
  key: string
  label: string
  color: DitherColor | string // preset name or a hex colour (#rrggbb)
  variant: AreaVariant
  on: boolean
  locked: boolean
  isClickable: boolean
}

export type Margins = { top: number; right: number; bottom: number; left: number }

export type GridPart = { on: boolean; locked: boolean; horizontal: boolean; vertical: boolean; dash: string }
export type XAxisPart = { on: boolean; locked: boolean; tickMargin: number; maxTicks: number }
export type YAxisPart = { on: boolean; locked: boolean; tickCount: number; tickMargin: number }
export type LegendPart = { on: boolean; locked: boolean; align: "left" | "center" | "right"; clickable: boolean }
export type TooltipPart = { on: boolean; locked: boolean; variant: TooltipVariant }

/** A fully granular, editable chart. The renderer, the layers panel, the
 * inspector and the code exporter all read/write this one shape. */
export type ChartModel = {
  type: ChartType
  bloom: BloomLevel
  stackType: StackType
  animate: boolean
  interactive: boolean
  animationDuration: number
  animationDelay: number
  easing: EasingInput // preset name or custom cubic-bezier points
  sparkles: boolean
  hoverLift: boolean
  stagger: number
  innerRadius: number
  margins: Margins
  series: SeriesRow[]
  grid: GridPart
  xAxis: XAxisPart
  yAxis: YAxisPart
  legend: LegendPart
  tooltip: TooltipPart
}

export type LayerKind =
  | "root"
  | "grid"
  | "xAxis"
  | "yAxis"
  | "series"
  | "pie"
  | "legend"
  | "tooltip"

export type Layer = {
  id: string
  kind: LayerKind
  label: string
  seriesKey?: string
}
