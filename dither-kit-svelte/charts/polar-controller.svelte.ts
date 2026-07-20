import type { CommonChart, TooltipItem } from "./common-context"
import type { VariantInput } from "../engine/dither-paint"
import { type Seed, seedFromColor } from "../engine/palette"
import { pieSlices, radarAxes } from "./polar"
import {
  type PolarChartContextValue,
  type PolarControllerInput,
} from "./polar-context"

type Row = Record<string, unknown>

/**
 * Builds the shared polar chart context (pie / radar). Same runes translation as
 * the cartesian controller: `$derived` for geometry/scales, `$state` for
 * interaction and registered variants, a plain getter object as the value, and a
 * change-detecting `revision` derivation in place of Vue's data/replay watcher.
 * No `$effect`.
 */
export function usePolarController(
  input: PolarControllerInput
): PolarChartContextValue {
  let selectedDataKey = $state<string | null>(input.defaultSelectedDataKey)
  let focusDataKey = $state<string | null>(null)
  let hoverIndex = $state<number | null>(null)
  let cursorX = $state(0)
  let cursorY = $state(0)
  let isMouseInChart = $state(false)
  let variants = $state<Record<string, VariantInput>>({})
  let variantRevision = $state(0)

  // See `chart-controller.svelte.ts`: change-detecting counter replaces Vue's
  // non-immediate `watch([data, replayToken])`.
  let revisionCount = 0
  let prevData: Row[] | null = null
  let prevReplay: number | null = null
  const revision = $derived.by(() => {
    const d = input.data()
    const r = input.replayToken()
    if (d !== prevData || r !== prevReplay) {
      if (prevData !== null || prevReplay !== null) revisionCount += 1
      prevData = d
      prevReplay = r
    }
    return revisionCount
  })

  const configKeys = $derived(Object.keys(input.config()))
  const plotWidth = $derived(
    Math.max(0, input.dimensions().width - input.margins().left - input.margins().right)
  )
  const plotHeight = $derived(
    Math.max(0, input.dimensions().height - input.margins().top - input.margins().bottom)
  )
  const ready = $derived(plotWidth > 0 && plotHeight > 0)
  const pad = input.chartType === "radar" ? 20 : 6
  const outerRadius = $derived(
    Math.max(0, Math.min(plotWidth, plotHeight) / 2 - pad)
  )
  const innerRadius = $derived(
    input.chartType === "pie" ? outerRadius * input.innerRadiusRatio() : 0
  )

  const seedOf = (key: string): Seed => seedFromColor(input.config()[key]?.color ?? "grey")
  const variantOf = (key: string): VariantInput =>
    variants[key] ?? variants["*"] ?? "gradient"
  const registerVariant = (key: string, variant: VariantInput) => {
    if (variants[key] === variant) return
    variants = { ...variants, [key]: variant }
    variantRevision += 1
  }
  const unregisterVariant = (key: string) => {
    if (!(key in variants)) return
    const next = { ...variants }
    delete next[key]
    variants = next
    variantRevision += 1
  }

  const selectDataKey = (key: string | null) => {
    selectedDataKey = key
    input.onSelectionChange?.(key)
  }
  const setFocusDataKey = (key: string | null) => {
    focusDataKey = key
  }
  const setHoverIndex = (i: number | null) => {
    hoverIndex = i
  }
  const setCursor = (px: number, py: number) => {
    cursorX = px
    cursorY = py
  }
  const setMouseInChart = (over: boolean) => {
    isMouseInChart = over
  }

  const pie = $derived(
    input.chartType === "pie"
      ? pieSlices(input.data(), input.dataKey(), input.nameKey(), input.startAngle())
      : null
  )
  const radar = $derived.by(() => {
    if (input.chartType !== "radar") return null
    let max = 0
    for (const row of input.data()) {
      for (const key of configKeys) {
        const v = Number(row[key]) || 0
        if (v > max) max = v
      }
    }
    return { axes: radarAxes(input.data(), input.nameKey()), max: max || 1 }
  })

  const common: CommonChart = {
    get names() {
      return input.chartType === "pie" && pie
        ? pie.map((s) => s.name)
        : configKeys
    },
    labelOf: (n: string) => input.config()[n]?.label ?? n,
    seedOf,
    get selectedDataKey() {
      return selectedDataKey
    },
    selectDataKey,
    get focusDataKey() {
      return focusDataKey
    },
    setFocusDataKey,
    get hoverIndex() {
      return hoverIndex
    },
    get ready() {
      return ready
    },
    get tooltipLeft() {
      return Math.max(
        48,
        Math.min(plotWidth + input.margins().left - 48, cursorX)
      )
    },
    get tooltipTop() {
      return Math.max(input.margins().top + 44, cursorY)
    },
    heading: (i: number) =>
      input.chartType === "pie"
        ? pie?.[i]?.name ?? null
        : radar?.axes[i]?.label ?? null,
    itemsAt: (i: number): TooltipItem[] => {
      const emphasis = selectedDataKey ?? focusDataKey
      if (input.chartType === "pie") {
        const s = pie?.[i]
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
      return configKeys.map((name) => {
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
      return configKeys
    },
    get data() {
      return input.data()
    },
    get dataLength() {
      return input.data().length
    },
    get ready() {
      return ready
    },
    get plot() {
      return { width: plotWidth, height: plotHeight }
    },
    get margins() {
      return input.margins()
    },
    get center() {
      return { x: plotWidth / 2, y: plotHeight / 2 }
    },
    get outerRadius() {
      return outerRadius
    },
    get innerRadius() {
      return innerRadius
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
      return revision
    },
    get variantRevision() {
      return variantRevision
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
    variantOf,
    registerVariant,
    unregisterVariant,
    get selectedDataKey() {
      return selectedDataKey
    },
    selectDataKey,
    get focusDataKey() {
      return focusDataKey
    },
    setFocusDataKey,
    get hoverIndex() {
      return hoverIndex
    },
    setHoverIndex,
    setCursor,
    get isMouseInChart() {
      return isMouseInChart
    },
    setMouseInChart,
    get pie() {
      return pie
    },
    get radar() {
      return radar
    },
    common,
  }
}
