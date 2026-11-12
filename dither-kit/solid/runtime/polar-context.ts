// Solid's binding of the polar chart context (`engine/polar-context.ts`
// holds the types): the context, its boundary guards and the controller a
// polar root builds.

import { createContext, createEffect, createMemo, createSignal, on, useContext } from "solid-js"
import type { ChartConfig, Margins } from "../../engine/chart-context"
import type { CommonChart, TooltipItem } from "../../engine/common-context"
import type { BloomInput, EasingInput, VariantInput } from "../../engine/dither-paint"
import { type Seed, seedFromColor } from "../../engine/palette"
import { pieSlices, radarAxes } from "../../engine/polar"
import type { PolarChartContextValue } from "../../engine/polar-context"
import type { Dimensions } from "../../engine/use-chart-dimensions"
import { useVariantMatrix } from "./screen"

export type { PolarChartContextValue } from "../../engine/polar-context"

type Row = Record<string, unknown>

export const PolarChartContext = createContext<PolarChartContextValue>()

const ROOT_OF: Record<string, string> = {
  pie: "<PieChart />",
  radar: "<RadarChart />",
}

export function usePolarChart(): PolarChartContextValue {
  const ctx = useContext(PolarChartContext)
  if (!ctx) {
    throw new Error("Polar chart parts must be used within a polar chart root.")
  }
  return ctx
}

/** Boundary guard for polar parts (`<Pie>`, `<Radar>`). */
export function usePolarPart(part: string, kind: "pie" | "radar"): PolarChartContextValue {
  const ctx = useContext(PolarChartContext)
  if (!ctx) {
    throw new Error(`<${part} /> must be used within ${ROOT_OF[kind]}.`)
  }
  if (ctx.chartType !== kind) {
    throw new Error(`<${part} /> is not valid inside ${ROOT_OF[ctx.chartType]} — it belongs in ${ROOT_OF[kind]}.`)
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
  animationDelay: () => number
  easing: () => EasingInput
  hoverLift: () => boolean
  cell: () => number
  popOut: () => number
  rimWidth: () => number
  falloff: () => number
  hoverStrength: () => number
  dimOpacity: () => number
  startAngle: () => number
  rings: () => number
  replayToken: () => number
  bloom: () => BloomInput
  bloomOnHover: () => boolean
  precompiled: () => string | undefined
  defaultSelectedDataKey: string | null
  onSelectionChange?: (key: string | null) => void
}

export function usePolarController(input: PolarControllerInput): PolarChartContextValue {
  const [selectedDataKey, setSelectedDataKeySignal] = createSignal<string | null>(input.defaultSelectedDataKey)
  const [focusDataKey, setFocusDataKeySignal] = createSignal<string | null>(null)
  const [hoverIndex, setHoverIndexSignal] = createSignal<number | null>(null)
  const [cursorX, setCursorXSignal] = createSignal(0)
  const [cursorY, setCursorYSignal] = createSignal(0)
  const [isMouseInChart, setIsMouseInChartSignal] = createSignal(false)
  const [variants, setVariantsSignal] = createSignal<Record<string, VariantInput>>({})
  const [variantRevision, setVariantRevisionSignal] = createSignal(0)

  const [revision, setRevision] = createSignal(0)
  createEffect(on([input.data, input.replayToken], () => setRevision((r) => r + 1), { defer: true }))

  const configKeys = createMemo(() => Object.keys(input.config()))
  const plotWidth = createMemo(() =>
    Math.max(0, input.dimensions().width - input.margins().left - input.margins().right),
  )
  const plotHeight = createMemo(() =>
    Math.max(0, input.dimensions().height - input.margins().top - input.margins().bottom),
  )
  const ready = createMemo(() => plotWidth() > 0 && plotHeight() > 0)
  const pad = input.chartType === "radar" ? 20 : 6
  const outerRadius = createMemo(() => Math.max(0, Math.min(plotWidth(), plotHeight()) / 2 - pad))
  const innerRadius = createMemo(() => (input.chartType === "pie" ? outerRadius() * input.innerRadiusRatio() : 0))

  const seedOf = (key: string): Seed => seedFromColor(input.config()[key]?.color ?? "grey")
  const matrixOf = useVariantMatrix()
  const variantOf = (key: string): VariantInput => variants()[key] ?? variants()["*"] ?? "gradient"
  const registerVariant = (key: string, variant: VariantInput) => {
    if (variants()[key] === variant) return
    setVariantsSignal({ ...variants(), [key]: variant })
    setVariantRevisionSignal((n) => n + 1)
  }
  const unregisterVariant = (key: string) => {
    if (!(key in variants())) return
    const next = { ...variants() }
    delete next[key]
    setVariantsSignal(next)
    setVariantRevisionSignal((n) => n + 1)
  }

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
  const setCursor = (px: number, py: number) => {
    setCursorXSignal(px)
    setCursorYSignal(py)
  }
  const setMouseInChart = (over: boolean) => {
    setIsMouseInChartSignal(over)
  }

  const pie = createMemo(() =>
    input.chartType === "pie" ? pieSlices(input.data(), input.dataKey(), input.nameKey(), input.startAngle()) : null,
  )
  const radar = createMemo(() => {
    if (input.chartType !== "radar") return null
    let max = 0
    for (const row of input.data()) {
      for (const key of configKeys()) {
        const v = Number(row[key]) || 0
        if (v > max) max = v
      }
    }
    return { axes: radarAxes(input.data(), input.nameKey()), max: max || 1 }
  })

  const common: CommonChart = {
    get names() {
      const slices = pie()
      return input.chartType === "pie" && slices ? slices.map((s) => s.name) : configKeys()
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
      return Math.max(input.margins().top + 44, cursorY())
    },
    heading: (i: number) =>
      input.chartType === "pie" ? (pie()?.[i]?.name ?? null) : (radar()?.axes[i]?.label ?? null),
    itemsAt: (i: number): TooltipItem[] => {
      const emphasis = selectedDataKey() ?? focusDataKey()
      if (input.chartType === "pie") {
        const s = pie()?.[i]
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
      return configKeys().map((name) => {
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
    get ready() {
      return ready()
    },
    get plot() {
      return { width: plotWidth(), height: plotHeight() }
    },
    get margins() {
      return input.margins()
    },
    get center() {
      return { x: plotWidth() / 2, y: plotHeight() / 2 }
    },
    get outerRadius() {
      return outerRadius()
    },
    get innerRadius() {
      return innerRadius()
    },
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
    get hoverLift() {
      return input.hoverLift()
    },
    get cell() {
      return input.cell()
    },
    get popOut() {
      return input.popOut()
    },
    get rimWidth() {
      return input.rimWidth()
    },
    get falloff() {
      return input.falloff()
    },
    get hoverStrength() {
      return input.hoverStrength()
    },
    get dimOpacity() {
      return input.dimOpacity()
    },
    get startAngle() {
      return input.startAngle()
    },
    get rings() {
      return input.rings()
    },
    get revision() {
      return revision()
    },
    get variantRevision() {
      return variantRevision()
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
    seedOf,
    matrixOf,
    variantOf,
    registerVariant,
    unregisterVariant,
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
    setCursor,
    get isMouseInChart() {
      return isMouseInChart()
    },
    setMouseInChart,
    get pie() {
      return pie()
    },
    get radar() {
      return radar()
    },
    common,
  }
}
