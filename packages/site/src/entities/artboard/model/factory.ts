import { createChart } from "@/entities/chart"
import { createWidget, isSimpleWidgetKind, type SimpleWidgetKind } from "@/entities/widget"
import type { ChartType } from "@/shared/config"
import type { Artboard } from "./types"

let counter = 0
const uid = () => `ab${Date.now().toString(36)}${(counter++).toString(36)}`

export type ArtboardKind = ChartType | SimpleWidgetKind

const TITLE: Record<ArtboardKind, string> = {
  area: "Area chart",
  line: "Line chart",
  bar: "Bar chart",
  pie: "Pie chart",
  radar: "Radar chart",
  avatar: "Avatar",
  button: "Button",
  gradient: "Gradient",
  image: "Image",
}

export function createArtboard(kind: ArtboardKind, x = 0, y = 0): Artboard {
  const widget = isSimpleWidgetKind(kind) ? createWidget(kind) : undefined
  const size = widget
    ? widget.kind === "button"
      ? { w: 220, h: 96 }
      : widget.kind === "image"
        ? { w: 320, h: 240 }
        : { w: 280, h: 280 }
    : { w: 520, h: 360 }
  return {
    id: uid(),
    name: TITLE[kind],
    x,
    y,
    ...size,
    hidden: false,
    locked: false,
    groupId: null,
    // Widget frames keep a stub chart so every chart-typed read stays safe.
    chart: createChart(widget ? "area" : (kind as ChartType)),
    ...(widget ? { widget } : {}),
  }
}

/** Deep clone for duplicate and paste, standing where its source stands
 * (the editor places copies on free canvas). JSON round-trip (not structuredClone) because the
 * source chart is the store's proxy, which structuredClone can't clone; the
 * model is pure JSON-serializable data so this is exact. */
export function cloneArtboard(src: Artboard): Artboard {
  const chart = JSON.parse(JSON.stringify(src.chart)) as Artboard["chart"]
  const widget = src.widget ? (JSON.parse(JSON.stringify(src.widget)) as Artboard["widget"]) : undefined
  return {
    id: uid(),
    name: `${src.name} copy`,
    x: src.x,
    y: src.y,
    w: src.w,
    h: src.h,
    hidden: false,
    locked: false,
    groupId: src.groupId,
    chart,
    ...(widget ? { widget } : {}),
  }
}
