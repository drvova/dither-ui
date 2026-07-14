import { type ChartType, familyOf } from "@/shared/config"
import { dataFor } from "./data"
import type { ChartModel, DataRow, SeriesRow } from "./types"

/** A fresh copy of the family's sample rows — each chart owns its data. */
export function seedRows(type: ChartType): DataRow[] {
  return JSON.parse(JSON.stringify(dataFor(familyOf(type)))) as DataRow[]
}

function seriesFor(type: ChartType): SeriesRow[] {
  const fam = familyOf(type)
  const mk = (
    key: string,
    label: string,
    color: SeriesRow["color"],
    on: boolean
  ): SeriesRow => ({
    key,
    label,
    color,
    variant: "gradient",
    on,
    locked: false,
    isClickable: true,
    dots: { on: false, variant: "border", r: 2 },
    activeDot: { on: false, variant: "colored-border", r: 3 },
    opacity: 1,
  })

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
    animationDelay: 0,
    easing: defaultEasing(type),
    sparkles: true,
    hoverLift: true,
    stagger: 0.55,
    cell: 2,
    sparkleDensity: 1,
    sparkleSpeed: 1,
    barGap: 0.28,
    glowSize: 0.16,
    popOut: 6,
    rimWidth: 1.4,
    falloff: 0.45,
    barEdge: 0.18,
    hoverStrength: 1,
    dimOpacity: 0.3,
    crosshair: true,
    startAngle: 0,
    radarRings: 4,
    innerRadius: 0.5,
    margins: { ...DEFAULT_MARGINS },
    rows: seedRows(type),
    series: seriesFor(type),
    grid: { on: true, locked: false, horizontal: true, vertical: false, dash: "3 3", tickCount: 4 },
    xAxis: { on: true, locked: false, tickMargin: 8, maxTicks: 8 },
    yAxis: { on: true, locked: false, tickCount: 4, tickMargin: 8 },
    legend: { on: true, locked: false, align: "right", clickable: true },
    tooltip: { on: true, locked: false, variant: "default" },
  }
}

/** Change chart type; when the family changes, reset the series to that
 * family's defaults so keys line up with the dataset. */
/** Each type's native entrance feel — bars grow with an ease-out wave. */
export function defaultEasing(type: ChartType): ChartModel["easing"] {
  return type === "bar" ? "ease-out" : "ease-in-out"
}

export function setChartType(chart: ChartModel, type: ChartType): void {
  const familyChanged = familyOf(chart.type) !== familyOf(type)
  // Keep a deliberate easing choice; follow the new type's default otherwise.
  if (chart.easing === defaultEasing(chart.type)) chart.easing = defaultEasing(type)
  chart.type = type
  if (familyChanged) {
    chart.series = seriesFor(type)
    chart.rows = seedRows(type)
    chart.legend.align = familyOf(type) === "cartesian" ? "right" : "center"
  }
}
