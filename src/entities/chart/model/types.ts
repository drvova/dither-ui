import type { ChartType } from "@/shared/config"
import type {
  AreaVariant,
  BloomLevel,
  DitherColor,
  StackType,
  TooltipVariant,
} from "@/shared/dither-kit"

export type SeriesRow = {
  key: string
  label: string
  color: DitherColor
  variant: AreaVariant
  on: boolean
  isClickable: boolean
}

export type Margins = { top: number; right: number; bottom: number; left: number }

export type GridPart = { on: boolean; horizontal: boolean; vertical: boolean; dash: string }
export type XAxisPart = { on: boolean; tickMargin: number; maxTicks: number }
export type YAxisPart = { on: boolean; tickCount: number; tickMargin: number }
export type LegendPart = { on: boolean; align: "left" | "center" | "right"; clickable: boolean }
export type TooltipPart = { on: boolean; variant: TooltipVariant }

/** A fully granular, editable chart. The renderer, the layers panel, the
 * inspector and the code exporter all read/write this one shape. */
export type ChartModel = {
  type: ChartType
  bloom: BloomLevel
  stackType: StackType
  animate: boolean
  interactive: boolean
  animationDuration: number
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
