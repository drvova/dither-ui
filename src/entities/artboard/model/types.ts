import type { ChartModel } from "@/entities/chart"

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
  chart: ChartModel
}
