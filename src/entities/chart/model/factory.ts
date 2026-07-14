import { type ChartType, familyOf } from "@/shared/config"
import type { ChartModel, SeriesRow } from "./types"

function seriesFor(type: ChartType): SeriesRow[] {
  const fam = familyOf(type)
  const mk = (
    key: string,
    label: string,
    color: SeriesRow["color"],
    on: boolean
  ): SeriesRow => ({ key, label, color, variant: "gradient", on, isClickable: true })

  if (fam === "pie")
    return [
      mk("chrome", "Chrome", "blue", true),
      mk("safari", "Safari", "green", true),
      mk("firefox", "Firefox", "orange", true),
      mk("edge", "Edge", "purple", true),
      mk("other", "Other", "grey", true),
    ]
  if (fam === "radar")
    return [
      mk("alpha", "Alpha", "pink", true),
      mk("beta", "Beta", "blue", true),
      mk("gamma", "Gamma", "green", false),
    ]
  return [
    mk("desktop", "Desktop", "blue", true),
    mk("mobile", "Mobile", "purple", true),
    mk("tablet", "Tablet", "green", false),
    mk("watch", "Watch", "orange", false),
  ]
}

const DEFAULT_MARGINS = { top: 10, right: 12, bottom: 22, left: 36 }

export function createChart(type: ChartType = "area"): ChartModel {
  return {
    type,
    bloom: "low",
    stackType: "default",
    animate: true,
    interactive: true,
    animationDuration: 900,
    innerRadius: 0.5,
    margins: { ...DEFAULT_MARGINS },
    series: seriesFor(type),
    grid: { on: true, horizontal: true, vertical: false, dash: "3 3" },
    xAxis: { on: true, tickMargin: 8, maxTicks: 8 },
    yAxis: { on: true, tickCount: 4, tickMargin: 8 },
    legend: { on: true, align: "right", clickable: true },
    tooltip: { on: true, variant: "default" },
  }
}

/** Change chart type; when the family changes, reset the series to that
 * family's defaults so keys line up with the dataset. */
export function setChartType(chart: ChartModel, type: ChartType): void {
  const familyChanged = familyOf(chart.type) !== familyOf(type)
  chart.type = type
  if (familyChanged) {
    chart.series = seriesFor(type)
    chart.legend.align = familyOf(type) === "cartesian" ? "right" : "center"
  }
}
