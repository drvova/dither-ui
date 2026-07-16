import {
  type Component,
  computed,
  defineComponent,
  Fragment,
  h,
  type PropType,
  provide,
  type VNode,
} from "vue"
import {
  type ChartConfig,
  ChartKey,
  type ChartType,
  type Margins,
  useChartController,
} from "./chart-context"
import { CommonChartKey } from "./common-context"
import type { BloomInput, EasingInput } from "./dither-paint"
import { precompiledSrc, type PrecompiledDither } from "./precompile"
import { bloomFromSeed, easingFromSeed, geometryFromSeed, motionFromSeed } from "./dither-paint"
import { cn } from "./lib"
import type { StackType } from "./scales"
import { useChartDimensions } from "./use-chart-dimensions"

type Row = Record<string, unknown>

const DEFAULT_MARGINS: Margins = { top: 10, right: 12, bottom: 22, left: 36 }

/** Which render layer a composed part targets — defaults to the front SVG. */
function layerOf(node: VNode): "back" | "dom" | "svg" {
  const t = node.type as { chartLayer?: "back" | "dom" } | string | symbol
  if (!t || typeof t === "string" || typeof t === "symbol") return "svg"
  return t.chartLayer ?? "svg"
}

/** Flatten fragments so v-for / template groups route by each real child. */
function flatten(nodes: VNode[] | undefined): VNode[] {
  const out: VNode[] = []
  for (const n of nodes ?? []) {
    if (n.type === Fragment && Array.isArray(n.children)) {
      out.push(...flatten(n.children as VNode[]))
    } else if (typeof n.type !== "symbol") {
      out.push(n)
    }
  }
  return out
}

export type CartesianChartProps = {
  data: Row[]
  config: ChartConfig
  stackType?: StackType
  margins?: Partial<Margins>
  class?: string
  animate?: boolean
  animationDuration?: number
  replayToken?: number
  interactive?: boolean
  markerIndex?: number | null
  hovered?: boolean
  bloom?: BloomInput
  bloomOnHover?: boolean
  onHoverChange?: (index: number | null) => void
  defaultSelectedDataKey?: string | null
  onSelectionChange?: (key: string | null) => void
  precompiled?: PrecompiledDither
}

/**
 * Shared root for the cartesian dither charts (area, line, bar). Owns the
 * measured size, the shared context, and pointer interaction; every visual is
 * composed as slotted children. Back chrome (grid) sits behind the dither
 * canvas; the canvas paints the fill/line/bars + stars; front chrome (axes,
 * dots) and DOM legend/tooltip layer on top. `chartType` drives the scales and
 * the `canvas` prop supplies the family's painter.
 */
/**
 * Builds a concrete cartesian chart component (AreaChart, LineChart, BarChart)
 * with `chartType` + `canvas` baked in, so the public component exposes only the
 * data/config/composition props — no forwarding, fully typed.
 */
export function defineCartesianChart(chartType: ChartType, canvas: Component) {
  return defineComponent({
  name: `${chartType[0].toUpperCase()}${chartType.slice(1)}Chart`,
  props: {
    data: { type: Array as PropType<Row[]>, required: true },
    config: { type: Object as PropType<ChartConfig>, required: true },
    stackType: { type: String as PropType<StackType>, default: "default" },
    margins: { type: Object as PropType<Partial<Margins>>, default: () => ({}) },
    class: { type: String, default: undefined },
    animate: { type: Boolean, default: true },
    /** Master seed — derives duration, delay, easing, stagger, sparkle
     * character and bloom for every prop the consumer left unset. */
    seed: { type: Number as PropType<number | undefined>, default: undefined },
    /** Dedicated edge-effect seed — pins the live-edge motion independent of
     * the master seed. Unset: falls back to the master seed, then sparkle. */
    effect: { type: Number as PropType<number | undefined>, default: undefined },
    animationDuration: { type: Number as PropType<number | undefined>, default: undefined },
    animationDelay: { type: Number as PropType<number | undefined>, default: undefined },
    easing: {
      type: [String, Array, Number] as PropType<EasingInput | undefined>,
      default: undefined,
    },
    sparkles: { type: Boolean, default: true },
    hoverLift: { type: Boolean, default: true },
    stagger: { type: Number as PropType<number | undefined>, default: undefined },
    cell: { type: Number, default: 2 },
    sparkleDensity: { type: Number as PropType<number | undefined>, default: undefined },
    sparkleSpeed: { type: Number as PropType<number | undefined>, default: undefined },
    barGap: { type: Number as PropType<number | undefined>, default: undefined },
    barEdge: { type: Number as PropType<number | undefined>, default: undefined },
    glowSize: { type: Number as PropType<number | undefined>, default: undefined },
    hoverStrength: { type: Number as PropType<number | undefined>, default: undefined },
    dimOpacity: { type: Number as PropType<number | undefined>, default: undefined },
    crosshair: { type: Boolean, default: true },
    replayToken: { type: Number, default: 0 },
    interactive: { type: Boolean, default: true },
    markerIndex: { type: Number as PropType<number | null>, default: null },
    hovered: { type: Boolean, default: false },
    bloom: { type: [String, Object, Number] as PropType<BloomInput | undefined>, default: undefined },
    bloomOnHover: { type: Boolean, default: false },
    precompiled: { type: [String, Object] as PropType<PrecompiledDither | undefined>, default: undefined },
    defaultSelectedDataKey: {
      type: String as PropType<string | null>,
      default: null,
    },
    onHoverChange: {
      type: Function as PropType<(index: number | null) => void>,
      default: undefined,
    },
    onSelectionChange: {
      type: Function as PropType<(key: string | null) => void>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const chartTypeVal = chartType
    const canvasComp = canvas
    const { el, size } = useChartDimensions<HTMLDivElement>()
    const margins = computed<Margins>(() => ({
      ...DEFAULT_MARGINS,
      ...props.margins,
    }))
    const seeded = computed(() =>
      props.seed !== undefined ? motionFromSeed(props.seed) : null
    )
    const geo = computed(() =>
      props.seed !== undefined ? geometryFromSeed(props.seed) : null
    )

    const ctx = useChartController({
      chartType: chartTypeVal,
      data: () => props.data,
      config: () => props.config,
      stackType: () => props.stackType,
      dimensions: () => size.value,
      margins: () => margins.value,
      animate: () => props.animate,
      // Explicit prop > master-seed derivation > house default.
      animationDuration: () => props.animationDuration ?? seeded.value?.duration ?? 900,
      animationDelay: () => props.animationDelay ?? seeded.value?.delay ?? 0,
      easing: () =>
        props.easing ??
        (props.seed !== undefined
          ? easingFromSeed(props.seed)
          : chartTypeVal === "bar"
            ? "ease-out"
            : "ease-in-out"),
      sparkles: () => props.sparkles,
      hoverLift: () => props.hoverLift,
      stagger: () => props.stagger ?? seeded.value?.stagger ?? 0.55,
      cell: () => props.cell,
      sparkleDensity: () => props.sparkleDensity ?? seeded.value?.sparkleDensity ?? 1,
      sparkleSpeed: () => props.sparkleSpeed ?? seeded.value?.sparkleSpeed ?? 1,
      barGap: () => props.barGap ?? geo.value?.barGap ?? 0.28,
      barEdge: () => props.barEdge ?? geo.value?.barEdge ?? 0.18,
      glowSize: () => props.glowSize ?? geo.value?.glowSize ?? 0.16,
      hoverStrength: () => props.hoverStrength ?? geo.value?.hoverStrength ?? 1,
      dimOpacity: () => props.dimOpacity ?? geo.value?.dimOpacity ?? 0.3,
      crosshair: () => props.crosshair,
      replayToken: () => props.replayToken,
      markerIndex: () => props.markerIndex,
      hovered: () => props.hovered,
      bloom: () =>
        props.bloom ?? (props.seed !== undefined ? bloomFromSeed(props.seed) : "off"),
      bloomOnHover: () => props.bloomOnHover,
      precompiled: () => precompiledSrc(props.precompiled),
      seed: () => props.seed,
      effect: () => props.effect,
      defaultSelectedDataKey: props.defaultSelectedDataKey,
      onSelectionChange: props.onSelectionChange,
    })

    provide(ChartKey, ctx)
    provide(CommonChartKey, ctx.common)

    const onMove = (clientX: number) => {
      const node = el.value
      if (!node) return
      const rect = node.getBoundingClientRect()
      const px = clientX - rect.left - margins.value.left
      const index = ctx.indexAtX(px)
      ctx.setHoverIndex(index)
      ctx.setCursorX(clientX - rect.left)
      props.onHoverChange?.(index)
    }

    return () => {
      const children = flatten(slots.default?.())
      const back: VNode[] = []
      const svg: VNode[] = []
      const dom: VNode[] = []
      for (const child of children) {
        const layer = layerOf(child)
        if (layer === "back") back.push(child)
        else if (layer === "dom") dom.push(child)
        else svg.push(child)
      }

      const { width, height } = size.value
      const m = margins.value
      const transform = `translate(${m.left},${m.top})`

      const layers: VNode[] = []
      if (ctx.ready && back.length > 0) {
        layers.push(
          h(
            "svg",
            {
              width,
              height,
              class: "absolute inset-0 overflow-visible",
              "aria-hidden": "true",
              role: "presentation",
            },
            [h("g", { transform }, back)]
          )
        )
      }
      layers.push(h(canvasComp))
      if (ctx.ready) {
        layers.push(
          h(
            "svg",
            {
              width,
              height,
              class: "absolute inset-0 overflow-visible",
              role: "img",
              "aria-label": "Chart",
            },
            [h("g", { transform }, svg)]
          )
        )
      }
      layers.push(...dom)

      return h(
        "div",
        {
          ref: el,
          class: cn("relative h-full w-full", props.class),
          onPointerenter: () => ctx.setMouseInChart(true),
          onPointermove: props.interactive
            ? (e: PointerEvent) => onMove(e.clientX)
            : undefined,
          onPointerleave: () => {
            ctx.setMouseInChart(false)
            ctx.setHoverIndex(null)
            props.onHoverChange?.(null)
          },
        },
        layers
      )
    }
  },
  })
}
