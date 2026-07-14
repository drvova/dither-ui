import { createChart } from "@/entities/chart"
import type { ChartType } from "@/shared/config"
import type { Artboard } from "./types"

let counter = 0
const uid = () => `ab${Date.now().toString(36)}${(counter++).toString(36)}`

const TITLE: Record<ChartType, string> = {
  area: "Area", line: "Line", bar: "Bar", pie: "Pie", radar: "Radar",
}

export function createArtboard(type: ChartType, x = 0, y = 0): Artboard {
  return {
    id: uid(),
    name: `${TITLE[type]} chart`,
    x,
    y,
    w: 520,
    h: 360,
    chart: createChart(type),
  }
}

/** Deep clone for duplicate. JSON round-trip (not structuredClone) because the
 * source chart is a Vue reactive Proxy, which structuredClone can't clone; the
 * model is pure JSON-serializable data so this is exact. */
export function cloneArtboard(src: Artboard, dx = 32, dy = 32): Artboard {
  const chart = JSON.parse(JSON.stringify(src.chart)) as Artboard["chart"]
  return {
    id: uid(),
    name: `${src.name} copy`,
    x: src.x + dx,
    y: src.y + dy,
    w: src.w,
    h: src.h,
    chart,
  }
}
