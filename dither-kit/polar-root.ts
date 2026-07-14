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
import type { BloomInput, EasingName } from "./dither-paint"
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
      innerRadius: { type: Number, default: 0 },
      margins: {
        type: Object as PropType<Partial<Margins>>,
        default: () => ({}),
      },
      class: { type: String, default: undefined },
      animate: { type: Boolean, default: true },
      animationDuration: { type: Number, default: 900 },
      animationDelay: { type: Number, default: 0 },
      easing: { type: String as PropType<EasingName>, default: "ease-in-out" },
      hoverLift: { type: Boolean, default: true },
      replayToken: { type: Number, default: 0 },
      bloom: { type: [String, Object] as PropType<BloomInput>, default: "off" },
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

      const ctx = usePolarController({
        chartType,
        data: () => props.data,
        config: () => props.config,
        dataKey: () => props.dataKey,
        nameKey: () => props.nameKey,
        innerRadiusRatio: () => props.innerRadius,
        dimensions: () => size.value,
        margins: () => margins.value,
        animate: () => props.animate,
        animationDuration: () => props.animationDuration,
        animationDelay: () => props.animationDelay,
        easing: () => props.easing,
        hoverLift: () => props.hoverLift,
        replayToken: () => props.replayToken,
        bloom: () => props.bloom,
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
