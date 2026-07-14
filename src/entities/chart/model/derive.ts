import { familyOf } from "@/shared/config"
import type { ChartConfig } from "@/shared/dither-kit"
import { dataFor, pieData } from "./data"
import type { ChartModel, SeriesRow } from "./types"

export const activeSeries = (chart: ChartModel): SeriesRow[] =>
  chart.series.filter((s) => s.on)

export function configOf(chart: ChartModel): ChartConfig {
  return Object.fromEntries(
    activeSeries(chart).map((s) => [s.key, { label: s.label, color: s.color }])
  )
}

export function dataOf(chart: ChartModel): Record<string, unknown>[] {
  const fam = familyOf(chart.type)
  if (fam === "pie") {
    const on = new Set(activeSeries(chart).map((s) => s.key))
    return pieData.filter((d) => on.has(d.name as string))
  }
  return dataFor(fam)
}
