import type { ChartType } from "@/shared/config"
import type {
  AreaVariant,
  BloomConfig,
  BloomLevel,
  DitherColor,
  DotVariant,
  EasingInput,
  StackType,
  TextureConfig,
  TooltipVariant,
  VariantInput,
} from "@dither-kit"

export type { AreaVariant, BloomConfig, DotVariant, TextureConfig, VariantInput }

/** Per-series point markers (rendered inside the series). */
export type MarkerConfig = { on: boolean; variant: DotVariant; r: number }

export type SeriesRow = {
  key: string
  label: string
  color: DitherColor | string // preset name or a hex colour (#rrggbb)
  variant: VariantInput // preset name or a fully custom texture
  on: boolean
  locked: boolean
  isClickable: boolean
  dots: MarkerConfig // a marker at every data point
  activeDot: MarkerConfig // the marker at the hovered point
  opacity: number // 0–1 layer opacity (cartesian series)
}

export type Margins = { top: number; right: number; bottom: number; left: number }

export type GridPart = { on: boolean; locked: boolean; horizontal: boolean; vertical: boolean; dash: string; tickCount: number }
export type XAxisPart = { on: boolean; locked: boolean; tickMargin: number; maxTicks: number }
export type YAxisPart = { on: boolean; locked: boolean; tickCount: number; tickMargin: number }
export type LegendPart = { on: boolean; locked: boolean; align: "left" | "center" | "right"; clickable: boolean }
export type TooltipPart = { on: boolean; locked: boolean; variant: TooltipVariant }

/** A fully granular, editable chart. The renderer, the layers panel, the
 * inspector and the code exporter all read/write this one shape. */
export type ChartModel = {
  type: ChartType
  bloom: BloomLevel | BloomConfig // preset or a fully custom glow
  stackType: StackType
  animate: boolean
  interactive: boolean
  animationDuration: number
  animationDelay: number
  easing: EasingInput // preset name or custom cubic-bezier points
  sparkles: boolean
  hoverLift: boolean
  stagger: number
  cell: number // css px per dither cell — pixel chunkiness
  sparkleDensity: number // star count multiplier (area/line)
  sparkleSpeed: number // wink speed multiplier (area/line)
  barGap: number // bar slot spacing fraction (bar)
  glowSize: number // line glow band height fraction (line)
  popOut: number // hovered-slice bulge px (pie)
  rimWidth: number // bright rim thickness (pie)
  falloff: number // edge-density falloff distance fraction (radar)
  barEdge: number // outer padding fraction at the plot edges (bar)
  hoverStrength: number // hover-lift intensity multiplier
  dimOpacity: number // opacity of non-selected series while one is emphasised
  crosshair: boolean // scrub crosshair column (cartesian)
  startAngle: number // pie start angle, degrees clockwise from 12 o'clock
  radarRings: number // concentric frame rings (radar)
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
