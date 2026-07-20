import { getContext, setContext } from "svelte"
import type { ChartConfig, ChartType, Margins } from "./chart-context"
import type { CommonChart } from "./common-context"
import type { BloomInput, EasingInput, VariantInput } from "../engine/dither-paint"
import type { Seed } from "../engine/palette"
import type { PieSlice, RadarAxis } from "./polar"
import type { Dimensions } from "./use-chart-dimensions"

type Row = Record<string, unknown>

const ROOT_OF: Record<string, string> = {
  pie: "<PieChart />",
  radar: "<RadarChart />",
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
  variantRevision: number
  bloom: BloomInput
  bloomOnHover: boolean
  precompiled: string | undefined
  seedOf: (key: string) => Seed
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

const PolarChartKey = Symbol("dither-polar-chart")

/** Published by a polar chart root (`<PieChart>`, `<RadarChart>`). */
export function setPolarChart(ctx: PolarChartContextValue): void {
  setContext(PolarChartKey, ctx)
}

/**
 * Lifecycle glue for `<Pie>`: registers the slice variant with the polar chart
 * while mounted, re-registers when the variant changes, and unregisters on
 * unmount. Svelte's action seam replaces the Vue part's `watch(immediate)` +
 * `onBeforeUnmount`.
 */
export function registerVariant(
  _node: Element,
  reg: { ctx: PolarChartContextValue; key: string; variant: VariantInput }
) {
  reg.ctx.registerVariant(reg.key, reg.variant)
  return {
    update(next: { ctx: PolarChartContextValue; key: string; variant: VariantInput }) {
      next.ctx.registerVariant(next.key, next.variant)
    },
    destroy() {
      reg.ctx.unregisterVariant(reg.key)
    },
  }
}

export function usePolarChart(): PolarChartContextValue {
  const ctx = getContext<PolarChartContextValue>(PolarChartKey) ?? null
  if (!ctx) {
    throw new Error("Polar chart parts must be used within a polar chart root.")
  }
  return ctx
}

/** Boundary guard for polar parts (`<Pie>`, `<Radar>`). */
export function usePolarPart(
  part: string,
  kind: "pie" | "radar"
): PolarChartContextValue {
  const ctx = getContext<PolarChartContextValue>(PolarChartKey) ?? null
  if (!ctx) {
    throw new Error(`<${part} /> must be used within ${ROOT_OF[kind]}.`)
  }
  if (ctx.chartType !== kind) {
    throw new Error(
      `<${part} /> is not valid inside ${ROOT_OF[ctx.chartType]} — it belongs in ${ROOT_OF[kind]}.`
    )
  }
  return ctx
}

/**
 * Reactive inputs a polar root feeds its context. In the Svelte port the
 * reactive assembly lives in the root component (which owns the `$state`/
 * `$derived` and publishes the built {@link PolarChartContextValue} via
 * {@link setPolarChart}); this type stays as the documented input contract.
 */
export type PolarControllerInput = {
  chartType: "pie" | "radar"
  data: () => Row[]
  config: () => ChartConfig
  dataKey: () => string
  nameKey: () => string
  innerRadiusRatio: () => number
  dimensions: () => Dimensions
  margins: () => Margins
  animate: () => boolean
  animationDuration: () => number
  animationDelay: () => number
  easing: () => EasingInput
  hoverLift: () => boolean
  cell: () => number
  popOut: () => number
  rimWidth: () => number
  falloff: () => number
  hoverStrength: () => number
  dimOpacity: () => number
  startAngle: () => number
  rings: () => number
  replayToken: () => number
  bloom: () => BloomInput
  bloomOnHover: () => boolean
  precompiled: () => string | undefined
  defaultSelectedDataKey: string | null
  onSelectionChange?: (key: string | null) => void
}
