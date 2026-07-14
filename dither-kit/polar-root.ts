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
import type { ChartConfig, Margins } from "./chart-context"
import { CommonChartKey } from "./common-context"
import type { BloomInput, EasingInput } from "./dither-paint"
import { bloomFromSeed, easingFromSeed, geometryFromSeed, motionFromSeed } from "./dither-paint"
import { cn } from "./lib"
import { axisAtAngle, sliceAtAngle } from "./polar"
import { PolarChartKey, usePolarController } from "./polar-context"
import { useChartDimensions } from "./use-chart-dimensions"

type Row = Record<string, unknown>

const DEFAULT_POLAR_MARGINS: Margins = { top: 22, right: 14, bottom: 14, left: 14 }

function layerOf(node: VNode): "back" | "dom" | "svg" {
  const t = node.type as { chartLayer?: "back" | "dom" } | string | symbol
  if (!t || typeof t === "string" || typeof t === "symbol") return "svg"
  return t.chartLayer ?? "svg"
}

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

export type PolarChartProps = {
  data: Row[]
  config: ChartConfig
  dataKey: string
  nameKey: string
  innerRadius?: number
  margins?: Partial<Margins>
  class?: string
  animate?: boolean
  animationDuration?: number
  replayToken?: number
  bloom?: BloomInput
  bloomOnHover?: boolean
  defaultSelectedDataKey?: string | null
  onSelectionChange?: (key: string | null) => void
}

/** Builds a concrete polar chart component (PieChart, RadarChart) with the
 * family painter + optional back decoration baked in. */
export function definePolarChart(
  chartType: "pie" | "radar",
  canvas: Component,
  backDecoration?: Component
) {
  return defineComponent({
    name: `${chartType[0].toUpperCase()}${chartType.slice(1)}Chart`,
    props: {
      data: { type: Array as PropType<Row[]>, required: true },
      config: { type: Object as PropType<ChartConfig>, required: true },
      dataKey: { type: String, default: "" },
      nameKey: { type: String, required: true },
      innerRadius: { type: Number as PropType<number | undefined>, default: undefined },
      margins: {
        type: Object as PropType<Partial<Margins>>,
        default: () => ({}),
      },
      class: { type: String, default: undefined },
      animate: { type: Boolean, default: true },
      /** Master seed — derives duration, delay, easing, bloom and start angle
       * for every prop the consumer left unset. */
      seed: { type: Number as PropType<number | undefined>, default: undefined },
      animationDuration: { type: Number as PropType<number | undefined>, default: undefined },
      animationDelay: { type: Number as PropType<number | undefined>, default: undefined },
      easing: {
        type: [String, Array, Number] as PropType<EasingInput | undefined>,
        default: undefined,
      },
      hoverLift: { type: Boolean, default: true },
      cell: { type: Number, default: 2 },
      popOut: { type: Number as PropType<number | undefined>, default: undefined },
      rimWidth: { type: Number as PropType<number | undefined>, default: undefined },
      falloff: { type: Number as PropType<number | undefined>, default: undefined },
      hoverStrength: { type: Number as PropType<number | undefined>, default: undefined },
      dimOpacity: { type: Number as PropType<number | undefined>, default: undefined },
      startAngle: { type: Number as PropType<number | undefined>, default: undefined },
      rings: { type: Number as PropType<number | undefined>, default: undefined },
      replayToken: { type: Number, default: 0 },
      bloom: { type: [String, Object, Number] as PropType<BloomInput | undefined>, default: undefined },
      bloomOnHover: { type: Boolean, default: false },
      defaultSelectedDataKey: {
        type: String as PropType<string | null>,
        default: null,
      },
      onSelectionChange: {
        type: Function as PropType<(key: string | null) => void>,
        default: undefined,
      },
    },
    setup(props, { slots }) {
      const { el, size } = useChartDimensions<HTMLDivElement>()
      const margins = computed<Margins>(() => ({
        ...DEFAULT_POLAR_MARGINS,
        ...props.margins,
      }))
      const seeded = computed(() =>
        props.seed !== undefined ? motionFromSeed(props.seed) : null
      )
      const geo = computed(() =>
        props.seed !== undefined ? geometryFromSeed(props.seed) : null
      )

      const ctx = usePolarController({
        chartType,
        data: () => props.data,
        config: () => props.config,
        dataKey: () => props.dataKey,
        nameKey: () => props.nameKey,
        innerRadiusRatio: () => props.innerRadius ?? geo.value?.innerRadius ?? 0,
        dimensions: () => size.value,
        margins: () => margins.value,
        animate: () => props.animate,
        // Explicit prop > master-seed derivation > house default.
        animationDuration: () => props.animationDuration ?? seeded.value?.duration ?? 900,
        animationDelay: () => props.animationDelay ?? seeded.value?.delay ?? 0,
        easing: () =>
          props.easing ?? (props.seed !== undefined ? easingFromSeed(props.seed) : "ease-in-out"),
        hoverLift: () => props.hoverLift,
        cell: () => props.cell,
        popOut: () => props.popOut ?? geo.value?.popOut ?? 6,
        rimWidth: () => props.rimWidth ?? geo.value?.rimWidth ?? 1.4,
        falloff: () => props.falloff ?? geo.value?.falloff ?? 0.45,
        hoverStrength: () => props.hoverStrength ?? geo.value?.hoverStrength ?? 1,
        dimOpacity: () => props.dimOpacity ?? geo.value?.dimOpacity ?? 0.3,
        startAngle: () => props.startAngle ?? seeded.value?.startAngle ?? 0,
        rings: () => props.rings ?? geo.value?.rings ?? 4,
        replayToken: () => props.replayToken,
        bloom: () =>
          props.bloom ?? (props.seed !== undefined ? bloomFromSeed(props.seed) : "off"),
        bloomOnHover: () => props.bloomOnHover,
        defaultSelectedDataKey: props.defaultSelectedDataKey,
        onSelectionChange: props.onSelectionChange,
      })

      provide(PolarChartKey, ctx)
      provide(CommonChartKey, ctx.common)

      const onMove = (clientX: number, clientY: number) => {
        const node = el.value
        if (!node) return
        const rect = node.getBoundingClientRect()
        const m = margins.value
        const dx = clientX - rect.left - m.left - ctx.center.x
        const dy = clientY - rect.top - m.top - ctx.center.y
        const angle = Math.atan2(dy, dx)
        const r = Math.hypot(dx, dy)
        if (chartType === "pie" && ctx.pie) {
          const inside = r <= ctx.outerRadius && r >= ctx.innerRadius
          const i = inside ? sliceAtAngle(ctx.pie, angle) : -1
          ctx.setHoverIndex(i >= 0 ? i : null)
        } else if (ctx.radar) {
          ctx.setHoverIndex(axisAtAngle(ctx.radar.axes, angle))
        }
        ctx.setCursor(clientX - rect.left, clientY - rect.top)
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
        if (ctx.ready) {
          const backGroup: VNode[] = []
          if (backDecoration) backGroup.push(h(backDecoration))
          backGroup.push(...back)
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
              [h("g", { transform }, backGroup)]
            )
          )
        }
        layers.push(h(canvas))
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
            onPointermove: (e: PointerEvent) => onMove(e.clientX, e.clientY),
            onPointerleave: () => {
              ctx.setMouseInChart(false)
              ctx.setHoverIndex(null)
            },
          },
          layers
        )
      }
    },
  })
}
