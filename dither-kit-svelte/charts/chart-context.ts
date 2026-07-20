import type { ScaleLinear } from "d3-scale"
import { getContext, setContext } from "svelte"
import type { CommonChart } from "./common-context"
import type { BloomInput, EasingInput, VariantInput } from "../engine/dither-paint"
import type { DitherColor, Seed } from "../engine/palette"
import type { StackType } from "./scales"
import type { Dimensions } from "./use-chart-dimensions"

/** Which chart root a part is composed under — drives the boundary guards. */
export type ChartType = "area" | "bar" | "line" | "pie" | "radar"

export type ChartConfig = Record<string, { label?: string; color: DitherColor | number | string }>

export type Margins = { top: number; right: number; bottom: number; left: number }

type Row = Record<string, unknown>

// `AreaVariant` is owned by `./dither-paint` (single source of truth); re-export
// it here with the other paint types so chart parts keep one import site.
export type { AreaVariant, TextureConfig, VariantInput } from "../engine/dither-paint"
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
  barSlot: (
    index: number,
    seriesIndex: number,
    seriesCount: number
  ) => { x: number; width: number }
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
  common: CommonChart
}

const ChartKey = Symbol("dither-chart")

const ROOT_OF: Record<ChartType, string> = {
  area: "<AreaChart />",
  bar: "<BarChart />",
  line: "<LineChart />",
  pie: "<PieChart />",
  radar: "<RadarChart />",
}

/** Published by a cartesian chart root for every composed part to read. */
export function setChart(ctx: ChartContextValue): void {
  setContext(ChartKey, ctx)
}

/**
  * Lifecycle glue for `<Bar>` / `<Line>` / `<Area>`: registers the series spec
  * with the chart while the part is mounted and re-registers when the spec
  * changes, unregistering on unmount. Svelte's action seam replaces the Vue
  * part's `watch(immediate)` + `onBeforeUnmount`.
  */
export function registerSeries(
  _node: Element,
  reg: { ctx: ChartContextValue; spec: SeriesSpec }
) {
  reg.ctx.registerSeries(reg.spec)
  return {
    update(next: { ctx: ChartContextValue; spec: SeriesSpec }) {
      next.ctx.registerSeries(next.spec)
    },
    destroy() {
      reg.ctx.unregisterSeries(reg.spec.dataKey)
    },
  }
}

/** Generic accessor for internal layers (canvas/overlay) that work for any root. */
export function useChart(): ChartContextValue {
  const ctx = getContext<ChartContextValue>(ChartKey) ?? null
  if (!ctx) {
    throw new Error(
      "Chart parts must be used within a chart root (e.g. <AreaChart />)."
    )
  }
  return ctx
}

/**
 * Boundary guard for a composable part. Throws a precise error when used outside
 * a root, or inside the wrong chart type — e.g. `<Bar />` placed in an area
 * chart. `kind` omitted means the part works under any root (grid, axes, …).
 */
export function useChartPart(
  part: string,
  kind?: ChartType | ChartType[]
): ChartContextValue {
  const ctx = getContext<ChartContextValue>(ChartKey) ?? null
  if (!ctx) {
    const where = kind ? ROOT_OF[Array.isArray(kind) ? kind[0] : kind] : "a chart root"
    throw new Error(`<${part} /> must be used within ${where}.`)
  }
  if (kind) {
    const allowed = Array.isArray(kind) ? kind : [kind]
    if (!allowed.includes(ctx.chartType)) {
      throw new Error(
        `<${part} /> is not valid inside ${ROOT_OF[ctx.chartType]} — it belongs in ${allowed
          .map((k) => ROOT_OF[k])
          .join(" or ")}.`
      )
    }
  }
  return ctx
}

/**
 * Reactive inputs the root feeds the controller (getters keep dep-tracking).
 * In the Svelte port the reactive assembly of the context lives in the chart
 * root component itself (which owns the `$state`/`$derived` and publishes the
 * built {@link ChartContextValue} via {@link setChart}); this type stays as the
 * documented input contract the root builds against.
 */
export type ControllerInput = {
  chartType: ChartType
  data: () => Row[]
  config: () => ChartConfig
  stackType: () => StackType
  dimensions: () => Dimensions
  margins: () => Margins
  animate: () => boolean
  animationDuration: () => number
  animationDelay: () => number
  easing: () => EasingInput
  sparkles: () => boolean
  hoverLift: () => boolean
  stagger: () => number
  cell: () => number
  sparkleDensity: () => number
  sparkleSpeed: () => number
  barGap: () => number
  barEdge: () => number
  glowSize: () => number
  hoverStrength: () => number
  dimOpacity: () => number
  crosshair: () => boolean
  replayToken: () => number
  markerIndex: () => number | null
  hovered: () => boolean
  bloom: () => BloomInput
  bloomOnHover: () => boolean
  precompiled: () => string | undefined
  seed: () => number | undefined
  effect: () => number | undefined
  defaultSelectedDataKey: string | null
  onSelectionChange?: (key: string | null) => void
}
