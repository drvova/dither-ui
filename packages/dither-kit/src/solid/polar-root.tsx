import { type Component, createMemo, type JSX, mergeProps, splitProps } from "solid-js"
import { CHART_FALLBACK, chartName } from "../engine/chart-svg"
import { bloomFromSeed, easingFromSeed, geometryFromSeed, motionFromSeed } from "../engine/dither-paint"
import type { BloomInput, EasingInput } from "../engine/dither-paint"
import { axisAtAngle, sliceAtAngle } from "../engine/polar"
import { precompiledSrc, type PrecompiledDither } from "../engine/precompile"
import { cn } from "../tailwind/lib"
import type { ChartConfig, Margins } from "./runtime/chart-context"
import { ChartLayers } from "./runtime/chart-layer"
import { CommonChartContext } from "./runtime/common-context"
import { PolarChartContext, usePolarController } from "./runtime/polar-context"
import { useChartDimensions } from "./runtime/use-chart-dimensions"
import "./chart.css"

type Row = Record<string, unknown>

const DEFAULT_POLAR_MARGINS: Margins = { top: 22, right: 14, bottom: 14, left: 14 }

type OwnProps = {
  /** @default required */
  data: Row[]
  /** @default required */
  config: ChartConfig
  /** @default "" */
  dataKey?: string
  /** @default required */
  nameKey: string
  /** @docs number 0…0.85
   * @default seed / 0 */
  innerRadius?: number
  /** @default seed / 4 */
  rings?: number
  /** @default {} */
  margins?: Partial<Margins>
  /** @default undefined */
  class?: string
  /** @default true */
  animate?: boolean
  /** Master seed — derives duration, delay, easing, bloom and start angle
   * for every prop the consumer left unset.
   * @default undefined */
  seed?: number
  /** @docs number (ms)
   * @default seed / 900 */
  animationDuration?: number
  /** @docs number (ms)
   * @default seed / 0 */
  animationDelay?: number
  /** @docs name | bezier tuple | number
   * @default seed / ease-in-out */
  easing?: EasingInput
  /** @default true */
  hoverLift?: boolean
  /** @docs number (px)
   * @default 2 */
  cell?: number
  /** @default seed / 6 */
  popOut?: number
  /** @default seed / 1.4 */
  rimWidth?: number
  /** @default seed / 0.45 */
  falloff?: number
  /** @default seed / 1 */
  hoverStrength?: number
  /** @default seed / 0.3 */
  dimOpacity?: number
  /** @default seed / 0 */
  startAngle?: number
  /** @default 0 */
  replayToken?: number
  /** @docs "off" | "low" | "high" | "aura" | object | number
   * @default seed / off */
  bloom?: BloomInput
  /** @default false */
  bloomOnHover?: boolean
  /** @docs string | { src: string; width?: number; height?: number }: a packaged plot URL
   * @default undefined */
  precompiled?: PrecompiledDither
  /** @default null */
  defaultSelectedDataKey?: string | null
  /** @default undefined */
  onSelectionChange?: (key: string | null) => void
  /** @docs content */
  children?: JSX.Element
}

/** A polar chart's own props, and whatever else its root element takes. */
export type PolarChartProps = OwnProps & Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof OwnProps>

const OWN = [
  "data",
  "config",
  "dataKey",
  "nameKey",
  "innerRadius",
  "margins",
  "class",
  "animate",
  "seed",
  "animationDuration",
  "animationDelay",
  "easing",
  "hoverLift",
  "cell",
  "popOut",
  "rimWidth",
  "falloff",
  "hoverStrength",
  "dimOpacity",
  "startAngle",
  "rings",
  "replayToken",
  "bloom",
  "bloomOnHover",
  "defaultSelectedDataKey",
  "onSelectionChange",
  "precompiled",
  "children",
] as const satisfies readonly (keyof OwnProps)[]

/** Run a listener given to the root beside the root's own. */
function also<E extends Event>(handler: unknown, e: E) {
  if (typeof handler === "function") (handler as (e: E) => void)(e)
}

/** Builds a concrete polar chart component (PieChart, RadarChart) with the
 * family's print + optional back decoration baked in. */
export function definePolarChart(
  chartType: "pie" | "radar",
  plot: Component,
  backDecoration?: Component,
): Component<PolarChartProps> {
  return function PolarChart(raw: PolarChartProps) {
    const merged = mergeProps(
      {
        dataKey: "",
        margins: {} as Partial<Margins>,
        animate: true,
        hoverLift: true,
        cell: 2,
        replayToken: 0,
        bloomOnHover: false,
        defaultSelectedDataKey: null,
      },
      raw,
    )
    const [props, rest] = splitProps(merged, OWN)
    let el: HTMLDivElement | undefined
    const { size } = useChartDimensions(() => el, CHART_FALLBACK.polar)
    const margins = createMemo<Margins>(() => ({
      ...DEFAULT_POLAR_MARGINS,
      ...props.margins,
    }))
    const seeded = createMemo(() => (props.seed !== undefined ? motionFromSeed(props.seed) : null))
    const geo = createMemo(() => (props.seed !== undefined ? geometryFromSeed(props.seed) : null))

    const ctx = usePolarController({
      chartType,
      data: () => props.data,
      config: () => props.config,
      dataKey: () => props.dataKey,
      nameKey: () => props.nameKey,
      innerRadiusRatio: () => props.innerRadius ?? geo()?.innerRadius ?? 0,
      dimensions: size,
      margins,
      animate: () => props.animate,
      // Explicit prop > master-seed derivation > house default.
      animationDuration: () => props.animationDuration ?? seeded()?.duration ?? 900,
      animationDelay: () => props.animationDelay ?? seeded()?.delay ?? 0,
      easing: () => props.easing ?? (props.seed !== undefined ? easingFromSeed(props.seed) : "ease-in-out"),
      hoverLift: () => props.hoverLift,
      cell: () => props.cell,
      popOut: () => props.popOut ?? geo()?.popOut ?? 6,
      rimWidth: () => props.rimWidth ?? geo()?.rimWidth ?? 1.4,
      falloff: () => props.falloff ?? geo()?.falloff ?? 0.45,
      hoverStrength: () => props.hoverStrength ?? geo()?.hoverStrength ?? 1,
      dimOpacity: () => props.dimOpacity ?? geo()?.dimOpacity ?? 0.3,
      startAngle: () => props.startAngle ?? seeded()?.startAngle ?? 0,
      rings: () => props.rings ?? geo()?.rings ?? 4,
      replayToken: () => props.replayToken,
      bloom: () => props.bloom ?? (props.seed !== undefined ? bloomFromSeed(props.seed) : "off"),
      bloomOnHover: () => props.bloomOnHover,
      precompiled: () => precompiledSrc(props.precompiled),
      defaultSelectedDataKey: merged.defaultSelectedDataKey,
      onSelectionChange: (key) => props.onSelectionChange?.(key),
    })

    const onMove = (clientX: number, clientY: number) => {
      const node = el
      if (!node) return
      const rect = node.getBoundingClientRect()
      const m = margins()
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

    return (
      <PolarChartContext.Provider value={ctx}>
        <CommonChartContext.Provider value={ctx.common}>
          <div
            {...rest}
            ref={(node) => (el = node)}
            class={cn("relative h-full w-full", props.class)}
            onPointerEnter={(e) => {
              ctx.setMouseInChart(true)
              also(rest.onPointerEnter, e)
            }}
            onPointerMove={(e) => {
              onMove(e.clientX, e.clientY)
              also(rest.onPointerMove, e)
            }}
            onPointerLeave={(e) => {
              ctx.setMouseInChart(false)
              ctx.setHoverIndex(null)
              also(rest.onPointerLeave, e)
            }}
          >
            <ChartLayers
              width={size().width}
              height={size().height}
              transform={`translate(${margins().left},${margins().top})`}
              label={chartName(chartType, ctx.common.names.map(ctx.common.labelOf))}
              motion={{
                enter: ctx.animate,
                duration: ctx.animationDuration,
                delay: ctx.animationDelay,
                easing: ctx.easing,
                revision: ctx.revision,
                lift: ctx.hoverLift ? 0.22 * ctx.hoverStrength : 0,
                hovered: false,
                bloomOnHover: ctx.bloomOnHover,
                tooltip: ctx.common.tooltip,
              }}
              plot={plot}
              backDecoration={backDecoration}
            >
              {props.children}
            </ChartLayers>
          </div>
        </CommonChartContext.Provider>
      </PolarChartContext.Provider>
    )
  }
}
