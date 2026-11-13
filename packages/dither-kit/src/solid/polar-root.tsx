import { type Component, createMemo, type JSX, mergeProps, splitProps } from "solid-js"
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

type Row = Record<string, unknown>

const DEFAULT_POLAR_MARGINS: Margins = { top: 22, right: 14, bottom: 14, left: 14 }

type OwnProps = {
  data: Row[]
  config: ChartConfig
  dataKey?: string
  nameKey: string
  innerRadius?: number
  margins?: Partial<Margins>
  class?: string
  animate?: boolean
  /** Master seed — derives duration, delay, easing, bloom and start angle
   * for every prop the consumer left unset. */
  seed?: number
  animationDuration?: number
  animationDelay?: number
  easing?: EasingInput
  hoverLift?: boolean
  cell?: number
  popOut?: number
  rimWidth?: number
  falloff?: number
  hoverStrength?: number
  dimOpacity?: number
  startAngle?: number
  rings?: number
  replayToken?: number
  bloom?: BloomInput
  bloomOnHover?: boolean
  defaultSelectedDataKey?: string | null
  onSelectionChange?: (key: string | null) => void
  precompiled?: PrecompiledDither
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
 * family painter + optional back decoration baked in. */
export function definePolarChart(
  chartType: "pie" | "radar",
  canvas: Component,
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
    const { size } = useChartDimensions(() => el)
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
              ready={ctx.ready}
              canvas={canvas}
              backDecoration={backDecoration}
              alwaysBack
            >
              {props.children}
            </ChartLayers>
          </div>
        </CommonChartContext.Provider>
      </PolarChartContext.Provider>
    )
  }
}
