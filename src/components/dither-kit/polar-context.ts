import {
  computed,
  inject,
  type InjectionKey,
  markRaw,
  ref,
  watch,
} from "vue"
import type {
  AreaVariant,
  ChartConfig,
  ChartType,
  Margins,
} from "./chart-context"
import type { CommonChart, TooltipItem } from "./common-context"
import type { BloomInput } from "./dither-paint"
import { type Seed, seedOfColor } from "./palette"
import { type PieSlice, pieSlices, type RadarAxis, radarAxes } from "./polar"
import type { Dimensions } from "./use-chart-dimensions"

type Row = Record<string, unknown>

const ROOT_OF: Record<string, string> = {
  pie: "<PieChart />",
  radar: "<RadarChart />",
}

export type PolarChartContextValue = {
  chartType: ChartType
  config: ChartConfig
  configKeys: string[]
  data: Row[]
  dataLength: number
  ready: boolean
  plot: { width: number; height: number }
  margins: Margins
  center: { x: number; y: number }
  outerRadius: number
  innerRadius: number
  animate: boolean
  animationDuration: number
  revision: number
  bloom: BloomInput
  bloomOnHover: boolean
  seedOf: (key: string) => Seed
  variantOf: (key: string) => AreaVariant
  registerVariant: (key: string, variant: AreaVariant) => void
  unregisterVariant: (key: string) => void
  selectedDataKey: string | null
  selectDataKey: (key: string | null) => void
  focusDataKey: string | null
  setFocusDataKey: (key: string | null) => void
  hoverIndex: number | null
  setHoverIndex: (i: number | null) => void
  setCursor: (px: number, py: number) => void
  isMouseInChart: boolean
  setMouseInChart: (over: boolean) => void
  pie: PieSlice[] | null
  radar: { axes: RadarAxis[]; max: number } | null
  common: CommonChart
}

export const PolarChartKey: InjectionKey<PolarChartContextValue> =
  Symbol("dither-polar-chart")

export function usePolarChart(): PolarChartContextValue {
  const ctx = inject(PolarChartKey, null)
  if (!ctx) {
    throw new Error("Polar chart parts must be used within a polar chart root.")
  }
  return ctx
}

/** Boundary guard for polar parts (`<Pie>`, `<Radar>`). */
export function usePolarPart(
  part: string,
  kind: "pie" | "radar"
): PolarChartContextValue {
  const ctx = inject(PolarChartKey, null)
  if (!ctx) {
    throw new Error(`<${part} /> must be used within ${ROOT_OF[kind]}.`)
  }
  if (ctx.chartType !== kind) {
    throw new Error(
      `<${part} /> is not valid inside ${ROOT_OF[ctx.chartType]} — it belongs in ${ROOT_OF[kind]}.`
    )
  }
  return ctx
}

export type PolarControllerInput = {
  chartType: "pie" | "radar"
  data: () => Row[]
  config: () => ChartConfig
  dataKey: () => string
  nameKey: () => string
  innerRadiusRatio: () => number
  dimensions: () => Dimensions
  margins: () => Margins
  animate: () => boolean
  animationDuration: () => number
  replayToken: () => number
  bloom: () => BloomInput
  bloomOnHover: () => boolean
  defaultSelectedDataKey: string | null
  onSelectionChange?: (key: string | null) => void
}

export function usePolarController(
  input: PolarControllerInput
): PolarChartContextValue {
  const selectedDataKey = ref<string | null>(input.defaultSelectedDataKey)
  const focusDataKey = ref<string | null>(null)
  const hoverIndex = ref<number | null>(null)
  const cursorX = ref(0)
  const cursorY = ref(0)
  const isMouseInChart = ref(false)
  const variants = ref<Record<string, AreaVariant>>({})

  const revision = ref(0)
  watch(
    () => [input.data(), input.replayToken()] as const,
    () => {
      revision.value += 1
    }
  )

  const configKeys = computed(() => Object.keys(input.config()))
  const plotWidth = computed(() =>
    Math.max(0, input.dimensions().width - input.margins().left - input.margins().right)
  )
  const plotHeight = computed(() =>
    Math.max(0, input.dimensions().height - input.margins().top - input.margins().bottom)
  )
  const ready = computed(() => plotWidth.value > 0 && plotHeight.value > 0)
  const pad = input.chartType === "radar" ? 20 : 6
  const outerRadius = computed(() =>
    Math.max(0, Math.min(plotWidth.value, plotHeight.value) / 2 - pad)
  )
  const innerRadius = computed(() =>
    input.chartType === "pie" ? outerRadius.value * input.innerRadiusRatio() : 0
  )

  const seedOf = (key: string): Seed => seedOfColor(input.config()[key]?.color ?? "grey")
  const variantOf = (key: string): AreaVariant =>
    variants.value[key] ?? variants.value["*"] ?? "gradient"
  const registerVariant = (key: string, variant: AreaVariant) => {
    if (variants.value[key] === variant) return
    variants.value = { ...variants.value, [key]: variant }
  }
  const unregisterVariant = (key: string) => {
    if (!(key in variants.value)) return
    const next = { ...variants.value }
    delete next[key]
    variants.value = next
  }

  const selectDataKey = (key: string | null) => {
    selectedDataKey.value = key
    input.onSelectionChange?.(key)
  }
  const setFocusDataKey = (key: string | null) => {
    focusDataKey.value = key
  }
  const setHoverIndex = (i: number | null) => {
    hoverIndex.value = i
  }
  const setCursor = (px: number, py: number) => {
    cursorX.value = px
    cursorY.value = py
  }
  const setMouseInChart = (over: boolean) => {
    isMouseInChart.value = over
  }

  const pie = computed(() =>
    input.chartType === "pie"
      ? pieSlices(input.data(), input.dataKey(), input.nameKey())
      : null
  )
  const radar = computed(() => {
    if (input.chartType !== "radar") return null
    let max = 0
    for (const row of input.data()) {
      for (const key of configKeys.value) {
        const v = Number(row[key]) || 0
        if (v > max) max = v
      }
    }
    return { axes: radarAxes(input.data(), input.nameKey()), max: max || 1 }
  })

  const common: CommonChart = markRaw({
    get names() {
      return input.chartType === "pie" && pie.value
        ? pie.value.map((s) => s.name)
        : configKeys.value
    },
    labelOf: (n: string) => input.config()[n]?.label ?? n,
    seedOf,
    get selectedDataKey() {
      return selectedDataKey.value
    },
    selectDataKey,
    get focusDataKey() {
      return focusDataKey.value
    },
    setFocusDataKey,
    get hoverIndex() {
      return hoverIndex.value
    },
    get ready() {
      return ready.value
    },
    get tooltipLeft() {
      return Math.max(
        48,
        Math.min(plotWidth.value + input.margins().left - 48, cursorX.value)
      )
    },
    get tooltipTop() {
      return Math.max(input.margins().top + 44, cursorY.value)
    },
    heading: (i: number) =>
      input.chartType === "pie"
        ? pie.value?.[i]?.name ?? null
        : radar.value?.axes[i]?.label ?? null,
    itemsAt: (i: number): TooltipItem[] => {
      const emphasis = selectedDataKey.value ?? focusDataKey.value
      if (input.chartType === "pie") {
        const s = pie.value?.[i]
        if (!s) return []
        return [
          {
            name: s.name,
            label: input.config()[s.name]?.label ?? s.name,
            value: s.value,
            seed: seedOf(s.name),
            dimmed: emphasis !== null && emphasis !== s.name,
          },
        ]
      }
      return configKeys.value.map((name) => {
        const raw = input.data()[i]?.[name]
        return {
          name,
          label: input.config()[name]?.label ?? name,
          value: typeof raw === "number" ? raw : 0,
          seed: seedOf(name),
          dimmed: emphasis !== null && emphasis !== name,
        }
      })
    },
  })

  return markRaw({
    chartType: input.chartType,
    get config() {
      return input.config()
    },
    get configKeys() {
      return configKeys.value
    },
    get data() {
      return input.data()
    },
    get dataLength() {
      return input.data().length
    },
    get ready() {
      return ready.value
    },
    get plot() {
      return { width: plotWidth.value, height: plotHeight.value }
    },
    get margins() {
      return input.margins()
    },
    get center() {
      return { x: plotWidth.value / 2, y: plotHeight.value / 2 }
    },
    get outerRadius() {
      return outerRadius.value
    },
    get innerRadius() {
      return innerRadius.value
    },
    get animate() {
      return input.animate()
    },
    get animationDuration() {
      return input.animationDuration()
    },
    get revision() {
      return revision.value
    },
    get bloom() {
      return input.bloom()
    },
    get bloomOnHover() {
      return input.bloomOnHover()
    },
    seedOf,
    variantOf,
    registerVariant,
    unregisterVariant,
    get selectedDataKey() {
      return selectedDataKey.value
    },
    selectDataKey,
    get focusDataKey() {
      return focusDataKey.value
    },
    setFocusDataKey,
    get hoverIndex() {
      return hoverIndex.value
    },
    setHoverIndex,
    setCursor,
    get isMouseInChart() {
      return isMouseInChart.value
    },
    setMouseInChart,
    get pie() {
      return pie.value
    },
    get radar() {
      return radar.value
    },
    common,
  })
}
