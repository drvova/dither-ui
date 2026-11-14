// What a chart's fill is printed from, as one string per chart family: the
// ONE staleness rule of the chart canvases. A paint loop keeps the string of
// the fill it holds and reprints when it differs; a binding's canvas reads
// the same function to wake a sleeping loop, so nothing can stale a fill
// without waking it. Each series' threshold matrix is in it: a screen that
// changes around a chart reprints the chart.

import type { ChartContextValue, PolarChartContextValue } from "./chart-types"
import type { VariantInput } from "./dither-paint"

type Printed = Pick<
  ChartContextValue & PolarChartContextValue,
  "config" | "matrixOf" | "dimOpacity" | "bloom" | "bloomOnHover" | "isMouseInChart"
>

function fill(s: Printed, series: [key: string, variant: VariantInput][], own: unknown[]): string {
  return JSON.stringify([
    own,
    s.dimOpacity,
    s.bloom,
    s.bloomOnHover,
    s.isMouseInChart,
    series.map(([key, variant]) => [key, s.config[key]?.color, variant, s.matrixOf(variant)]),
  ])
}

/** The area, line and bar charts' fill. */
export const seriesFill = (s: ChartContextValue): string =>
  fill(
    s,
    s.configKeys.map((key) => [key, s.seriesSpecs[key]?.variant ?? "gradient"]),
    [s.stackType, s.hovered, s.configKeys.map((key) => s.seriesSpecs[key])],
  )

/** The pie and donut chart's fill. */
export const pieFill = (s: PolarChartContextValue): string => {
  const slices = s.pie ?? []
  return fill(
    s,
    slices.map((slice) => [slice.name, s.variantOf(slice.name)]),
    [s.innerRadius, s.outerRadius, s.rimWidth, s.popOut, slices.map((slice) => [slice.start, slice.end])],
  )
}

/** The radar chart's fill. */
export const radarFill = (s: PolarChartContextValue): string =>
  fill(
    s,
    s.configKeys.map((key) => [key, s.variantOf(key)]),
    [s.outerRadius, s.falloff],
  )
