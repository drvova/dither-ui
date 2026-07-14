import { familyOf } from "@/shared/config"
import type { ChartModel, Layer } from "./types"

const ROOT_LABEL: Record<string, string> = {
  area: "AreaChart",
  line: "LineChart",
  bar: "BarChart",
  pie: "PieChart",
  radar: "RadarChart",
}

/** The Figma-style layer tree for a chart, in paint order. `prefix` is the
 * owning artboard id so layer ids are globally unique. */
export function layersOf(chart: ChartModel, prefix: string): Layer[] {
  const fam = familyOf(chart.type)
  const out: Layer[] = [
    { id: `${prefix}:root`, kind: "root", label: ROOT_LABEL[chart.type] },
  ]
  if (fam === "cartesian") {
    out.push({ id: `${prefix}:grid`, kind: "grid", label: "Grid" })
    out.push({ id: `${prefix}:xAxis`, kind: "xAxis", label: "X Axis" })
    out.push({ id: `${prefix}:yAxis`, kind: "yAxis", label: "Y Axis" })
  }
  if (fam === "pie") out.push({ id: `${prefix}:pie`, kind: "pie", label: "Pie" })
  for (const s of chart.series) {
    out.push({
      id: `${prefix}:series:${s.key}`,
      kind: "series",
      label: s.label,
      seriesKey: s.key,
    })
  }
  out.push({ id: `${prefix}:legend`, kind: "legend", label: "Legend" })
  out.push({ id: `${prefix}:tooltip`, kind: "tooltip", label: "Tooltip" })
  return out
}
