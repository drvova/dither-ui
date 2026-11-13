import type { ChartModel } from "@/entities/chart"
import type { WidgetModel } from "@/entities/widget"

export type Artboard = {
  id: string
  name: string
  x: number
  y: number
  w: number
  h: number
  hidden: boolean
  locked: boolean
  groupId: string | null
  chart: ChartModel // meaningful for chart frames (widget frames keep a stub)
  widget?: WidgetModel // present = this frame is a standalone widget
}
