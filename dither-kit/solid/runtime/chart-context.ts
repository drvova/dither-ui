// Solid's binding of the cartesian chart context (`engine/chart-context.ts`
// holds the types): the context, its boundary guards and the controller a
// chart root builds.

import { createContext, createEffect, createMemo, createSignal, on, untrack, useContext } from "solid-js"
import type { ChartContextValue, ChartConfig, ChartType, Margins, SeriesSpec } from "../../engine/chart-context"
import type { CommonChart, TooltipItem } from "../../engine/common-context"
import type { BloomInput, EasingInput } from "../../engine/dither-paint"
import { type Seed, seedFromColor } from "../../engine/palette"
import {
  buildBandScale,
  buildXScale,
  buildYScale,
  computeBands,
  indexAtBand,
  nearestIndex,
  type StackType,
} from "../../engine/scales"
import type { Dimensions } from "../../engine/use-chart-dimensions"
import { useVariantMatrix } from "./screen"

export type {
  AreaVariant,
  ChartConfig,
  ChartContextValue,
  ChartType,
  Margins,
  SeriesKind,
  SeriesSpec,
  StrokeVariant,
  TextureConfig,
  VariantInput,
} from "../../engine/chart-context"

type Row = Record<string, unknown>

export const ChartContext = createContext<ChartContextValue>()

const ROOT_OF: Record<ChartType, string> = {
  area: "<AreaChart />",
  bar: "<BarChart />",
  line: "<LineChart />",
  pie: "<PieChart />",
  radar: "<RadarChart />",
}

/** Generic accessor for internal layers (canvas/overlay) that work for any root. */
export function useChart(): ChartContextValue {
  const ctx = useContext(ChartContext)
  if (!ctx) {
    throw new Error("Chart parts must be used within a chart root (e.g. <AreaChart />).")
  }
  return ctx
}

/**
 * Boundary guard for a composable part. Throws a precise error when used outside
 * a root, or inside the wrong chart type — e.g. `<Bar />` placed in an area
 * chart. `kind` omitted means the part works under any root (grid, axes, …).
 */
export function useChartPart(part: string, kind?: ChartType | ChartType[]): ChartContextValue {
  const ctx = useContext(ChartContext)
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
          .join(" or ")}.`,
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
  animationDelay: () => number
  easing: () => EasingInput
  sparkles: () => boolean
  hoverLift: () => boolean
  stagger: () => number
  cell: () => number
  sparkleDensity: () => number
  sparkleSpeed: () => number
  barGap: () => number
  barEdge: () => number
  glowSize: () => number
  hoverStrength: () => number
  dimOpacity: () => number
  crosshair: () => boolean
  replayToken: () => number
  markerIndex: () => number | null
  hovered: () => boolean
  bloom: () => BloomInput
  bloomOnHover: () => boolean
  precompiled: () => string | undefined
  seed: () => number | undefined
  effect: () => number | undefined
  defaultSelectedDataKey: string | null
  onSelectionChange?: (key: string | null) => void
}

/**
 * Builds the shared chart context. Derivations are memos, interaction is
 * signals, and the value is a plain object whose getters delegate to those
 * reactive sources: reading `ctx.ready` in JSX tracks, while the canvas RAF
 * loop reads `state.current.configKeys` fresh each frame.
 */
export function useChartController(input: ControllerInput): ChartContextValue {
  const isBar = input.chartType === "bar"

  const [selectedDataKey, setSelectedDataKeySignal] = createSignal<string | null>(input.defaultSelectedDataKey)
  const [focusDataKey, setFocusDataKeySignal] = createSignal<string | null>(null)
  const [hoverIndex, setHoverIndexSignal] = createSignal<number | null>(null)
  const [cursorX, setCursorXSignal] = createSignal(0)
  const [isMouseInChart, setIsMouseInChartSignal] = createSignal(false)
  const [seriesSpecs, setSeriesSpecsSignal] = createSignal<Record<string, SeriesSpec>>({})

  const [revision, setRevision] = createSignal(0)
  const [entranceDone, setEntranceDone] = createSignal(!input.animate())
  createEffect(
    on(
      [input.data, input.replayToken],
      () => {
        setRevision((r) => r + 1)
        setEntranceDone(!untrack(input.animate))
      },
      { defer: true },
    ),
  )
  const markEntranceDone = () => {
    setEntranceDone(true)
  }

  const configKeys = createMemo(() => Object.keys(input.config()))
  const derived = createMemo(() => computeBands(input.data(), configKeys(), input.stackType()))
  const bands = createMemo(() => derived().bands)
  const max = createMemo(() => derived().max)

  const plotWidth = createMemo(() =>
    Math.max(0, input.dimensions().width - input.margins().left - input.margins().right),
  )
  const plotHeight = createMemo(() =>
    Math.max(0, input.dimensions().height - input.margins().top - input.margins().bottom),
  )
  const ready = createMemo(() => plotWidth() > 0 && plotHeight() > 0)

  const xPoint = createMemo(() => buildXScale(input.data().length, plotWidth()))
  const xBand = createMemo(() => buildBandScale(input.data().length, plotWidth(), input.barGap(), input.barEdge()))
  const bandwidth = createMemo(() => (isBar ? xBand().bandwidth() : 0))
  const y = createMemo(() => buildYScale(max(), plotHeight()))

  const xCenter = (i: number) => (isBar ? (xBand()(i) ?? 0) + xBand().bandwidth() / 2 : (xPoint()(i) ?? 0))
  const indexAtX = (px: number) =>
    isBar ? indexAtBand(px, input.data().length, plotWidth()) : nearestIndex(px, input.data().length, plotWidth())
  const barSlot = (i: number, si: number, n: number) => {
    const center = xCenter(i)
    const st = input.stackType()
    const stacked = st === "stacked" || st === "percent"
    const bw = bandwidth()
    if (stacked) {
      const w = bw * 0.9
      return { x: center - w / 2, width: w }
    }
    const slot = bw / Math.max(n, 1)
    return { x: center - bw / 2 + si * slot + slot * 0.08, width: slot * 0.84 }
  }

  const seedOf = (key: string): Seed => seedFromColor(input.config()[key]?.color ?? "grey")
  const matrixOf = useVariantMatrix()

  const selectDataKey = (key: string | null) => {
    setSelectedDataKeySignal(key)
    input.onSelectionChange?.(key)
  }
  const setFocusDataKey = (key: string | null) => {
    setFocusDataKeySignal(key)
  }
  const setHoverIndex = (i: number | null) => {
    setHoverIndexSignal(i)
  }
  const setCursorX = (px: number) => {
    setCursorXSignal(px)
  }
  const setMouseInChart = (over: boolean) => {
    setIsMouseInChartSignal(over)
  }
  const registerSeries = (spec: SeriesSpec) => {
    const cur = seriesSpecs()[spec.dataKey]
    if (
      cur &&
      cur.kind === spec.kind &&
      cur.variant === spec.variant &&
      cur.strokeVariant === spec.strokeVariant &&
      cur.opacity === spec.opacity
    )
      return
    setSeriesSpecsSignal({ ...seriesSpecs(), [spec.dataKey]: spec })
  }
  const unregisterSeries = (dataKey: string) => {
    if (!(dataKey in seriesSpecs())) return
    const next = { ...seriesSpecs() }
    delete next[dataKey]
    setSeriesSpecsSignal(next)
  }

  // The Legend/Tooltip surface — a getter facade over the same reactive state.
  const common: CommonChart = {
    get names() {
      return configKeys()
    },
    labelOf: (n: string) => input.config()[n]?.label ?? n,
    seedOf,
    get selectedDataKey() {
      return selectedDataKey()
    },
    selectDataKey,
    get focusDataKey() {
      return focusDataKey()
    },
    setFocusDataKey,
    get hoverIndex() {
      return hoverIndex()
    },
    get ready() {
      return ready()
    },
    get tooltipLeft() {
      return Math.max(48, Math.min(plotWidth() + input.margins().left - 48, cursorX()))
    },
    get tooltipTop() {
      const floor = input.margins().top + 44
      const hi = hoverIndex()
      if (hi == null) return floor
      let minY = Number.POSITIVE_INFINITY
      for (const key of configKeys()) {
        const b = bands()[key]?.[hi]
        if (b) minY = Math.min(minY, y()(b[1]))
      }
      if (!Number.isFinite(minY)) return floor
      return Math.max(floor, input.margins().top + minY)
    },
    heading: (i: number, labelKey?: string) => (labelKey ? String(input.data()[i]?.[labelKey] ?? "") : null),
    itemsAt: (i: number): TooltipItem[] =>
      configKeys().map((name) => {
        const raw = input.data()[i]?.[name]
        const emphasis = selectedDataKey() ?? focusDataKey()
        return {
          name,
          label: input.config()[name]?.label ?? name,
          value: typeof raw === "number" ? raw : 0,
          seed: seedOf(name),
          dimmed: emphasis !== null && emphasis !== name,
        }
      }),
  }

  return {
    chartType: input.chartType,
    get config() {
      return input.config()
    },
    get configKeys() {
      return configKeys()
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
      return { width: plotWidth(), height: plotHeight() }
    },
    get ready() {
      return ready()
    },
    xCenter,
    get bandwidth() {
      return bandwidth()
    },
    indexAtX,
    barSlot,
    get y() {
      return y()
    },
    get bands() {
      return bands()
    },
    get max() {
      return max()
    },
    get selectedDataKey() {
      return selectedDataKey()
    },
    selectDataKey,
    get focusDataKey() {
      return focusDataKey()
    },
    setFocusDataKey,
    get hoverIndex() {
      return hoverIndex()
    },
    setHoverIndex,
    get markerIndex() {
      return input.markerIndex()
    },
    get cursorX() {
      return cursorX()
    },
    setCursorX,
    get isMouseInChart() {
      return isMouseInChart()
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
    get precompiled() {
      return input.precompiled()
    },
    get seed() {
      return input.seed()
    },
    get effect() {
      return input.effect()
    },
    get seriesSpecs() {
      return seriesSpecs()
    },
    registerSeries,
    unregisterSeries,
    get animate() {
      return input.animate()
    },
    get animationDuration() {
      return input.animationDuration()
    },
    get animationDelay() {
      return input.animationDelay()
    },
    get easing() {
      return input.easing()
    },
    get sparkles() {
      return input.sparkles()
    },
    get hoverLift() {
      return input.hoverLift()
    },
    get stagger() {
      return input.stagger()
    },
    get cell() {
      return input.cell()
    },
    get sparkleDensity() {
      return input.sparkleDensity()
    },
    get sparkleSpeed() {
      return input.sparkleSpeed()
    },
    get barGap() {
      return input.barGap()
    },
    get barEdge() {
      return input.barEdge()
    },
    get glowSize() {
      return input.glowSize()
    },
    get hoverStrength() {
      return input.hoverStrength()
    },
    get dimOpacity() {
      return input.dimOpacity()
    },
    get crosshair() {
      return input.crosshair()
    },
    get revision() {
      return revision()
    },
    get entranceDone() {
      return entranceDone()
    },
    markEntranceDone,
    seedOf,
    matrixOf,
    common,
  }
}
