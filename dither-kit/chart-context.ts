import type { ScaleLinear } from "d3-scale"
import {
  computed,
  inject,
  type InjectionKey,
  markRaw,
  ref,
  watch,
} from "vue"
import type { CommonChart, TooltipItem } from "./common-context"
import type { BloomInput } from "./dither-paint"
import { type DitherColor, type Seed, seedFromColor } from "./palette"
import {
  buildBandScale,
  buildXScale,
  buildYScale,
  computeBands,
  indexAtBand,
  nearestIndex,
  type StackType,
} from "./scales"
import type { Dimensions } from "./use-chart-dimensions"

/** Which chart root a part is composed under — drives the boundary guards. */
export type ChartType = "area" | "bar" | "line" | "pie" | "radar"

export type ChartConfig = Record<string, { label?: string; color: DitherColor | number }>

export type Margins = { top: number; right: number; bottom: number; left: number }

type Row = Record<string, unknown>

export type AreaVariant = "gradient" | "dotted" | "hatched" | "solid"
export type StrokeVariant = "solid" | "dashed"
export type SeriesKind = "area" | "line" | "bar"

/** What each series part (<Area />, <Line />, <Bar />) registers so the canvas
 * knows which series to paint and how. */
export type SeriesSpec = {
  dataKey: string
  kind: SeriesKind
  variant: AreaVariant
  strokeVariant: StrokeVariant
}

export type ChartContextValue = {
  chartType: ChartType
  config: ChartConfig
  configKeys: string[]
  data: Row[]
  dataLength: number
  stackType: StackType
  margins: Margins
  plot: { width: number; height: number }
  ready: boolean
  xCenter: (index: number) => number
  bandwidth: number
  indexAtX: (px: number) => number
  barSlot: (
    index: number,
    seriesIndex: number,
    seriesCount: number
  ) => { x: number; width: number }
  y: ScaleLinear<number, number>
  bands: Record<string, [number, number][]>
  max: number
  selectedDataKey: string | null
  selectDataKey: (key: string | null) => void
  focusDataKey: string | null
  setFocusDataKey: (key: string | null) => void
  hoverIndex: number | null
  setHoverIndex: (index: number | null) => void
  markerIndex: number | null
  cursorX: number
  setCursorX: (px: number) => void
  isMouseInChart: boolean
  setMouseInChart: (over: boolean) => void
  hovered: boolean
  bloom: BloomInput
  bloomOnHover: boolean
  seriesSpecs: Record<string, SeriesSpec>
  registerSeries: (spec: SeriesSpec) => void
  unregisterSeries: (dataKey: string) => void
  animate: boolean
  animationDuration: number
  revision: number
  entranceDone: boolean
  markEntranceDone: () => void
  seedOf: (key: string) => Seed
  common: CommonChart
}

export const ChartKey: InjectionKey<ChartContextValue> = Symbol("dither-chart")

const ROOT_OF: Record<ChartType, string> = {
  area: "<AreaChart />",
  bar: "<BarChart />",
  line: "<LineChart />",
  pie: "<PieChart />",
  radar: "<RadarChart />",
}

/** Generic accessor for internal layers (canvas/overlay) that work for any root. */
export function useChart(): ChartContextValue {
  const ctx = inject(ChartKey, null)
  if (!ctx) {
    throw new Error(
      "Chart parts must be used within a chart root (e.g. <AreaChart />)."
    )
  }
  return ctx
}

/**
 * Boundary guard for a composable part. Throws a precise error when used outside
 * a root, or inside the wrong chart type — e.g. `<Bar />` placed in an area
 * chart. `kind` omitted means the part works under any root (grid, axes, …).
 */
export function useChartPart(
  part: string,
  kind?: ChartType | ChartType[]
): ChartContextValue {
  const ctx = inject(ChartKey, null)
  if (!ctx) {
    const where = kind ? ROOT_OF[Array.isArray(kind) ? kind[0] : kind] : "a chart root"
    throw new Error(`<${part} /> must be used within ${where}.`)
  }
  if (kind) {
    const allowed = Array.isArray(kind) ? kind : [kind]
    if (!allowed.includes(ctx.chartType)) {
      throw new Error(
        `<${part} /> is not valid inside ${ROOT_OF[ctx.chartType]} — it belongs in ${allowed
          .map((k) => ROOT_OF[k])
          .join(" or ")}.`
      )
    }
  }
  return ctx
}

/** Reactive inputs the root feeds the controller (getters keep dep-tracking). */
export type ControllerInput = {
  chartType: ChartType
  data: () => Row[]
  config: () => ChartConfig
  stackType: () => StackType
  dimensions: () => Dimensions
  margins: () => Margins
  animate: () => boolean
  animationDuration: () => number
  replayToken: () => number
  markerIndex: () => number | null
  hovered: () => boolean
  bloom: () => BloomInput
  bloomOnHover: () => boolean
  defaultSelectedDataKey: string | null
  onSelectionChange?: (key: string | null) => void
}

/**
 * Builds the shared chart context. Vue reactivity replaces the React memo
 * machinery: derivations are `computed`, interaction is `ref`, and the value is
 * a plain object whose getters delegate to those reactive sources — so reading
 * `ctx.ready` in a template tracks, while the canvas RAF loop reads
 * `state.value.configKeys` fresh each frame with no `.value` noise.
 */
export function useChartController(input: ControllerInput): ChartContextValue {
  const isBar = input.chartType === "bar"

  const selectedDataKey = ref<string | null>(input.defaultSelectedDataKey)
  const focusDataKey = ref<string | null>(null)
  const hoverIndex = ref<number | null>(null)
  const cursorX = ref(0)
  const isMouseInChart = ref(false)
  const seriesSpecs = ref<Record<string, SeriesSpec>>({})

  const revision = ref(0)
  watch(
    () => [input.data(), input.replayToken()] as const,
    () => {
      revision.value += 1
    }
  )

  const entranceDone = ref(!input.animate())
  watch(revision, () => {
    entranceDone.value = !input.animate()
  })
  const markEntranceDone = () => {
    entranceDone.value = true
  }

  const configKeys = computed(() => Object.keys(input.config()))
  const derived = computed(() =>
    computeBands(input.data(), configKeys.value, input.stackType())
  )
  const bands = computed(() => derived.value.bands)
  const max = computed(() => derived.value.max)

  const plotWidth = computed(() =>
    Math.max(0, input.dimensions().width - input.margins().left - input.margins().right)
  )
  const plotHeight = computed(() =>
    Math.max(0, input.dimensions().height - input.margins().top - input.margins().bottom)
  )
  const ready = computed(() => plotWidth.value > 0 && plotHeight.value > 0)

  const xPoint = computed(() => buildXScale(input.data().length, plotWidth.value))
  const xBand = computed(() => buildBandScale(input.data().length, plotWidth.value))
  const bandwidth = computed(() => (isBar ? xBand.value.bandwidth() : 0))
  const y = computed(() => buildYScale(max.value, plotHeight.value))

  const xCenter = (i: number) =>
    isBar
      ? (xBand.value(i) ?? 0) + xBand.value.bandwidth() / 2
      : (xPoint.value(i) ?? 0)
  const indexAtX = (px: number) =>
    isBar
      ? indexAtBand(px, input.data().length, plotWidth.value)
      : nearestIndex(px, input.data().length, plotWidth.value)
  const barSlot = (i: number, si: number, n: number) => {
    const center = xCenter(i)
    const st = input.stackType()
    const stacked = st === "stacked" || st === "percent"
    const bw = bandwidth.value
    if (stacked) {
      const w = bw * 0.9
      return { x: center - w / 2, width: w }
    }
    const slot = bw / Math.max(n, 1)
    return { x: center - bw / 2 + si * slot + slot * 0.08, width: slot * 0.84 }
  }

  const seedOf = (key: string): Seed =>
    seedFromColor(input.config()[key]?.color ?? "grey")

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
  const setCursorX = (px: number) => {
    cursorX.value = px
  }
  const setMouseInChart = (over: boolean) => {
    isMouseInChart.value = over
  }
  const registerSeries = (spec: SeriesSpec) => {
    const cur = seriesSpecs.value[spec.dataKey]
    if (
      cur &&
      cur.kind === spec.kind &&
      cur.variant === spec.variant &&
      cur.strokeVariant === spec.strokeVariant
    )
      return
    seriesSpecs.value = { ...seriesSpecs.value, [spec.dataKey]: spec }
  }
  const unregisterSeries = (dataKey: string) => {
    if (!(dataKey in seriesSpecs.value)) return
    const next = { ...seriesSpecs.value }
    delete next[dataKey]
    seriesSpecs.value = next
  }

  // The Legend/Tooltip surface — a getter facade over the same reactive state.
  const common: CommonChart = markRaw({
    get names() {
      return configKeys.value
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
      const floor = input.margins().top + 44
      const hi = hoverIndex.value
      if (hi == null) return floor
      let minY = Number.POSITIVE_INFINITY
      for (const key of configKeys.value) {
        const b = bands.value[key]?.[hi]
        if (b) minY = Math.min(minY, y.value(b[1]))
      }
      if (!Number.isFinite(minY)) return floor
      return Math.max(floor, input.margins().top + minY)
    },
    heading: (i: number, labelKey?: string) =>
      labelKey ? String(input.data()[i]?.[labelKey] ?? "") : null,
    itemsAt: (i: number): TooltipItem[] =>
      configKeys.value.map((name) => {
        const raw = input.data()[i]?.[name]
        const emphasis = selectedDataKey.value ?? focusDataKey.value
        return {
          name,
          label: input.config()[name]?.label ?? name,
          value: typeof raw === "number" ? raw : 0,
          seed: seedOf(name),
          dimmed: emphasis !== null && emphasis !== name,
        }
      }),
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
    get stackType() {
      return input.stackType()
    },
    get margins() {
      return input.margins()
    },
    get plot() {
      return { width: plotWidth.value, height: plotHeight.value }
    },
    get ready() {
      return ready.value
    },
    xCenter,
    get bandwidth() {
      return bandwidth.value
    },
    indexAtX,
    barSlot,
    get y() {
      return y.value
    },
    get bands() {
      return bands.value
    },
    get max() {
      return max.value
    },
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
    get markerIndex() {
      return input.markerIndex()
    },
    get cursorX() {
      return cursorX.value
    },
    setCursorX,
    get isMouseInChart() {
      return isMouseInChart.value
    },
    setMouseInChart,
    get hovered() {
      return input.hovered()
    },
    get bloom() {
      return input.bloom()
    },
    get bloomOnHover() {
      return input.bloomOnHover()
    },
    get seriesSpecs() {
      return seriesSpecs.value
    },
    registerSeries,
    unregisterSeries,
    get animate() {
      return input.animate()
    },
    get animationDuration() {
      return input.animationDuration()
    },
    get revision() {
      return revision.value
    },
    get entranceDone() {
      return entranceDone.value
    },
    markEntranceDone,
    seedOf,
    common,
  })
}
