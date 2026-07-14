import { computed, reactive } from "vue"
import type {
  AreaVariant,
  BloomLevel,
  ChartConfig,
  DitherColor,
  StackType,
} from "../components/dither-kit"
import { cartesianData, pieData, radarData } from "./data"

export type ChartType = "area" | "line" | "bar" | "pie" | "radar"
export type Family = "cartesian" | "pie" | "radar"

export type SeriesRow = {
  key: string
  label: string
  color: DitherColor
  on: boolean
}

export const familyOf = (t: ChartType): Family =>
  t === "pie" ? "pie" : t === "radar" ? "radar" : "cartesian"

/** The whole chart being built — one reactive source the preview and the
 * exported code both read. */
export const studio = reactive({
  type: "area" as ChartType,
  variant: "gradient" as AreaVariant,
  bloom: "low" as BloomLevel,
  stackType: "default" as StackType,
  animate: true,
  interactive: true,
  innerRadius: 0.5,
  parts: {
    grid: true,
    xAxis: true,
    yAxis: true,
    legend: true,
    tooltip: true,
  },
  series: {
    cartesian: [
      { key: "desktop", label: "Desktop", color: "blue", on: true },
      { key: "mobile", label: "Mobile", color: "purple", on: true },
      { key: "tablet", label: "Tablet", color: "green", on: false },
      { key: "watch", label: "Watch", color: "orange", on: false },
    ] as SeriesRow[],
    pie: [
      { key: "chrome", label: "Chrome", color: "blue", on: true },
      { key: "safari", label: "Safari", color: "green", on: true },
      { key: "firefox", label: "Firefox", color: "orange", on: true },
      { key: "edge", label: "Edge", color: "purple", on: true },
      { key: "other", label: "Other", color: "grey", on: true },
    ] as SeriesRow[],
    radar: [
      { key: "alpha", label: "Alpha", color: "pink", on: true },
      { key: "beta", label: "Beta", color: "blue", on: true },
      { key: "gamma", label: "Gamma", color: "green", on: false },
    ] as SeriesRow[],
  },
  replayToken: 0,
})

export function replay() {
  studio.replayToken += 1
}

/** Rows for the current chart family. */
export const rows = computed<SeriesRow[]>(
  () => studio.series[familyOf(studio.type)]
)
export const activeRows = computed(() => rows.value.filter((r) => r.on))

/** Config built from the active rows — the single source both preview + code use. */
export const config = computed<ChartConfig>(() =>
  Object.fromEntries(
    activeRows.value.map((r) => [r.key, { label: r.label, color: r.color }])
  )
)

/** Data for the current chart (pie filters to active slices). */
export const chartData = computed(() => {
  if (studio.type === "pie") {
    return pieData.filter((d) => activeRows.value.some((r) => r.key === d.name))
  }
  return studio.type === "radar" ? radarData : cartesianData
})

export const VARIANTS: AreaVariant[] = ["gradient", "dotted", "hatched", "solid"]
export const BLOOMS: BloomLevel[] = ["off", "low", "high", "aura"]
export const STACKS: StackType[] = ["default", "stacked", "percent"]
export const TYPES: ChartType[] = ["area", "line", "bar", "pie", "radar"]
export const COLORS: DitherColor[] = [
  "green",
  "blue",
  "purple",
  "pink",
  "orange",
  "red",
  "grey",
]
