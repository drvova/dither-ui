import {
  type ChartContextValue,
  type ControllerInput,
  type SeriesSpec,
} from "./chart-context"
import type { CommonChart, TooltipItem } from "./common-context"
import { type Seed, seedFromColor } from "./palette"
import {
  buildBandScale,
  buildXScale,
  buildYScale,
  computeBands,
  indexAtBand,
  nearestIndex,
} from "./scales"

type Row = Record<string, unknown>

/**
 * Builds the shared chart context. The Svelte runes port replaces the Vue memo
 * machinery: derivations are `$derived`, interaction is `$state`, and the value
 * is a plain object whose getters delegate to those reactive sources — so
 * reading `ctx.ready` in a template tracks, while the canvas rAF loop reads
 * `state.current.configKeys` fresh each frame. Lives in a `.svelte.ts` factory
 * (runes, but never `$effect`): the two Vue side-effecting watchers become a
 * change-detecting `revision` derivation plus an entrance-epoch derivation.
 */
export function useChartController(input: ControllerInput): ChartContextValue {
  const isBar = input.chartType === "bar"

  let selectedDataKey = $state<string | null>(input.defaultSelectedDataKey)
  let focusDataKey = $state<string | null>(null)
  let hoverIndex = $state<number | null>(null)
  let cursorX = $state(0)
  let isMouseInChart = $state(false)
  let seriesSpecs = $state<Record<string, SeriesSpec>>({})

  // Vue's `watch([data, replayToken], () => revision += 1)` (non-immediate)
  // becomes a change-detecting derivation: it bumps a monotonic counter only
  // when the data reference or replay token actually changes. Mutating plain
  // (non-rune) locals inside a `$derived` is a benign, deterministic side effect
  // — it runs once per real dependency change, exactly like the Vue watcher.
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

  // Vue keeps `entranceDone` as state reset by `watch(revision)` and flipped true
  // by `markEntranceDone`. Here it is a pure derivation over an "entrance epoch":
  // the revision at which the canvas reported the entrance complete. A new
  // revision (data/replay change) makes epoch !== revision again, so the reveal
  // restarts — no `$effect` needed.
  let entranceEpoch = $state(-1)
  const entranceDone = $derived(!input.animate() || entranceEpoch === revision)
  const markEntranceDone = () => {
    entranceEpoch = revision
  }

  const configKeys = $derived(Object.keys(input.config()))
  const bandsInfo = $derived.by(() =>
    computeBands(input.data(), configKeys, input.stackType())
  )
  const bands = $derived(bandsInfo.bands)
  const max = $derived(bandsInfo.max)

  const plotWidth = $derived(
    Math.max(0, input.dimensions().width - input.margins().left - input.margins().right)
  )
  const plotHeight = $derived(
    Math.max(0, input.dimensions().height - input.margins().top - input.margins().bottom)
  )
  const ready = $derived(plotWidth > 0 && plotHeight > 0)

  const xPoint = $derived(buildXScale(input.data().length, plotWidth))
  const xBand = $derived(
    buildBandScale(input.data().length, plotWidth, input.barGap(), input.barEdge())
  )
  const bandwidth = $derived(isBar ? xBand.bandwidth() : 0)
  const y = $derived(buildYScale(max, plotHeight))

  const xCenter = (i: number) =>
    isBar
      ? (xBand(i) ?? 0) + xBand.bandwidth() / 2
      : (xPoint(i) ?? 0)
  const indexAtX = (px: number) =>
    isBar
      ? indexAtBand(px, input.data().length, plotWidth)
      : nearestIndex(px, input.data().length, plotWidth)
  const barSlot = (i: number, si: number, n: number) => {
    const center = xCenter(i)
    const st = input.stackType()
    const stacked = st === "stacked" || st === "percent"
    const bw = bandwidth
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
    selectedDataKey = key
    input.onSelectionChange?.(key)
  }
  const setFocusDataKey = (key: string | null) => {
    focusDataKey = key
  }
  const setHoverIndex = (i: number | null) => {
    hoverIndex = i
  }
  const setCursorX = (px: number) => {
    cursorX = px
  }
  const setMouseInChart = (over: boolean) => {
    isMouseInChart = over
  }
  const registerSeries = (spec: SeriesSpec) => {
    const cur = seriesSpecs[spec.dataKey]
    if (
      cur &&
      cur.kind === spec.kind &&
      cur.variant === spec.variant &&
      cur.strokeVariant === spec.strokeVariant &&
      cur.opacity === spec.opacity
    )
      return
    seriesSpecs = { ...seriesSpecs, [spec.dataKey]: spec }
  }
  const unregisterSeries = (dataKey: string) => {
    if (!(dataKey in seriesSpecs)) return
    const next = { ...seriesSpecs }
    delete next[dataKey]
    seriesSpecs = next
  }

  // The Legend/Tooltip surface — a getter facade over the same reactive state.
  const common: CommonChart = {
    get names() {
      return configKeys
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
      const floor = input.margins().top + 44
      const hi = hoverIndex
      if (hi == null) return floor
      let minY = Number.POSITIVE_INFINITY
      for (const key of configKeys) {
        const b = bands[key]?.[hi]
        if (b) minY = Math.min(minY, y(b[1]))
      }
      if (!Number.isFinite(minY)) return floor
      return Math.max(floor, input.margins().top + minY)
    },
    heading: (i: number, labelKey?: string) =>
      labelKey ? String(input.data()[i]?.[labelKey] ?? "") : null,
    itemsAt: (i: number): TooltipItem[] =>
      configKeys.map((name) => {
        const raw = input.data()[i]?.[name]
        const emphasis = selectedDataKey ?? focusDataKey
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
      return configKeys
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
      return { width: plotWidth, height: plotHeight }
    },
    get ready() {
      return ready
    },
    xCenter,
    get bandwidth() {
      return bandwidth
    },
    indexAtX,
    barSlot,
    get y() {
      return y
    },
    get bands() {
      return bands
    },
    get max() {
      return max
    },
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
    get markerIndex() {
      return input.markerIndex()
    },
    get cursorX() {
      return cursorX
    },
    setCursorX,
    get isMouseInChart() {
      return isMouseInChart
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
      return seriesSpecs
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
      return revision
    },
    get entranceDone() {
      return entranceDone
    },
    markEntranceDone,
    seedOf,
    common,
  }
}
