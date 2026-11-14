// Generated from @dither-ui/kit/solid/cartesian-root.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { type Component, createMemo, type JSX, mergeProps, splitProps } from "solid-js"
import { bloomFromSeed, easingFromSeed, geometryFromSeed, motionFromSeed } from "@dither-ui/kit/engine/dither-paint.ts"
import type { BloomInput, EasingInput } from "@dither-ui/kit/engine/dither-paint.ts"
import { precompiledSrc, type PrecompiledDither } from "@dither-ui/kit/engine/precompile.ts"
import type { StackType } from "@dither-ui/kit/engine/scales.ts"
import { cn, type StyleProp } from "./lib"
import {
  ChartContext,
  type ChartConfig,
  type ChartType,
  type Margins,
  useChartController,
} from "@dither-ui/kit/solid/runtime/chart-context.ts"
import { ChartLayers } from "./runtime/chart-layer"
import { CommonChartContext } from "@dither-ui/kit/solid/runtime/common-context.ts"
import { useChartDimensions } from "@dither-ui/kit/solid/runtime/use-chart-dimensions.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", height: "100%", width: "100%" },
})

type Row = Record<string, unknown>

const DEFAULT_MARGINS: Margins = { top: 10, right: 12, bottom: 22, left: 36 }

type OwnProps = {
  /** @default required */
  data: Row[]
  /** @default required */
  config: ChartConfig
  /** @default "default" */
  stackType?: StackType
  /** @default {} */
  margins?: Partial<Margins>
  /** @default undefined */
  class?: string
  xstyle?: StyleProp
  /** @default true */
  interactive?: boolean
  /** @default true */
  animate?: boolean
  /** Master seed — derives duration, delay, easing, stagger, sparkle
   * character and bloom for every prop the consumer left unset.
   * @default undefined */
  seed?: number
  /** Dedicated edge-effect seed — pins the live-edge motion independent of
   * the master seed. Unset: falls back to the master seed, then sparkle.
   * @docs number (its own edge-motion seed)
   * @default seed / sparkle */
  effect?: number
  /** @docs number (ms)
   * @default seed / 900 */
  animationDuration?: number
  /** @docs number (ms)
   * @default seed / 0 */
  animationDelay?: number
  /** @docs name | bezier tuple | number
   * @default seed / chart default */
  easing?: EasingInput
  /** @default true */
  sparkles?: boolean
  /** @default true */
  hoverLift?: boolean
  /** @default seed / 0.55 */
  stagger?: number
  /** @docs number (px)
   * @default 2 */
  cell?: number
  /** @default seed / 1 */
  sparkleDensity?: number
  /** @default seed / 1 */
  sparkleSpeed?: number
  /** @default seed / 0.28 */
  barGap?: number
  /** @default seed / 0.18 */
  barEdge?: number
  /** @default seed / 0.16 */
  glowSize?: number
  /** @default seed / 1 */
  hoverStrength?: number
  /** @default seed / 0.3 */
  dimOpacity?: number
  /** @default true */
  crosshair?: boolean
  /** @docs number (bump it to re-run)
   * @default 0 */
  replayToken?: number
  /** @default null */
  markerIndex?: number | null
  /** @default false */
  hovered?: boolean
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
  onHoverChange?: (index: number | null) => void
  /** @default undefined */
  onSelectionChange?: (key: string | null) => void
  /** @docs content */
  children?: JSX.Element
}

/** A cartesian chart's own props, and whatever else its root element takes
 * (a role, ARIA, key and focus listeners: a sparkline is a slider). */
export type CartesianChartProps = OwnProps & Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof OwnProps>

const OWN = [
  "data",
  "config",
  "stackType",
  "margins",
  "class",
  "xstyle",
  "animate",
  "seed",
  "effect",
  "animationDuration",
  "animationDelay",
  "easing",
  "sparkles",
  "hoverLift",
  "stagger",
  "cell",
  "sparkleDensity",
  "sparkleSpeed",
  "barGap",
  "barEdge",
  "glowSize",
  "hoverStrength",
  "dimOpacity",
  "crosshair",
  "replayToken",
  "interactive",
  "markerIndex",
  "hovered",
  "bloom",
  "bloomOnHover",
  "onHoverChange",
  "defaultSelectedDataKey",
  "onSelectionChange",
  "precompiled",
  "children",
] as const satisfies readonly (keyof OwnProps)[]

/** Run a listener given to the root beside the root's own. */
function also<E extends Event>(handler: unknown, e: E) {
  if (typeof handler === "function") (handler as (e: E) => void)(e)
}

/**
 * Shared root for the cartesian dither charts (area, line, bar). Owns the
 * measured size, the shared context, and pointer interaction; every visual is
 * composed as children. Back chrome (grid) sits behind the dither
 * canvas; the canvas paints the fill/line/bars + stars; front chrome (axes,
 * dots) and DOM legend/tooltip layer on top. `chartType` drives the scales and
 * the `canvas` prop supplies the family's painter.
 */
/**
 * Builds a concrete cartesian chart component (AreaChart, LineChart, BarChart)
 * with `chartType` + `canvas` baked in, so the public component exposes only the
 * data/config/composition props — no forwarding, fully typed.
 */
export function defineCartesianChart(chartType: ChartType, canvas: Component): Component<CartesianChartProps> {
  return function CartesianChart(raw: CartesianChartProps) {
    const merged = mergeProps(
      {
        stackType: "default" as StackType,
        margins: {} as Partial<Margins>,
        animate: true,
        sparkles: true,
        hoverLift: true,
        cell: 2,
        crosshair: true,
        replayToken: 0,
        interactive: true,
        markerIndex: null,
        hovered: false,
        bloomOnHover: false,
        defaultSelectedDataKey: null,
      },
      raw,
    )
    const [props, rest] = splitProps(merged, OWN)
    let el: HTMLDivElement | undefined
    const { size } = useChartDimensions(() => el)
    const margins = createMemo<Margins>(() => ({
      ...DEFAULT_MARGINS,
      ...props.margins,
    }))
    const seeded = createMemo(() => (props.seed !== undefined ? motionFromSeed(props.seed) : null))
    const geo = createMemo(() => (props.seed !== undefined ? geometryFromSeed(props.seed) : null))

    const ctx = useChartController({
      chartType,
      data: () => props.data,
      config: () => props.config,
      stackType: () => props.stackType,
      dimensions: size,
      margins,
      animate: () => props.animate,
      // Explicit prop > master-seed derivation > house default.
      animationDuration: () => props.animationDuration ?? seeded()?.duration ?? 900,
      animationDelay: () => props.animationDelay ?? seeded()?.delay ?? 0,
      easing: () =>
        props.easing ??
        (props.seed !== undefined ? easingFromSeed(props.seed) : chartType === "bar" ? "ease-out" : "ease-in-out"),
      sparkles: () => props.sparkles,
      hoverLift: () => props.hoverLift,
      stagger: () => props.stagger ?? seeded()?.stagger ?? 0.55,
      cell: () => props.cell,
      sparkleDensity: () => props.sparkleDensity ?? seeded()?.sparkleDensity ?? 1,
      sparkleSpeed: () => props.sparkleSpeed ?? seeded()?.sparkleSpeed ?? 1,
      barGap: () => props.barGap ?? geo()?.barGap ?? 0.28,
      barEdge: () => props.barEdge ?? geo()?.barEdge ?? 0.18,
      glowSize: () => props.glowSize ?? geo()?.glowSize ?? 0.16,
      hoverStrength: () => props.hoverStrength ?? geo()?.hoverStrength ?? 1,
      dimOpacity: () => props.dimOpacity ?? geo()?.dimOpacity ?? 0.3,
      crosshair: () => props.crosshair,
      replayToken: () => props.replayToken,
      markerIndex: () => props.markerIndex,
      hovered: () => props.hovered,
      bloom: () => props.bloom ?? (props.seed !== undefined ? bloomFromSeed(props.seed) : "off"),
      bloomOnHover: () => props.bloomOnHover,
      precompiled: () => precompiledSrc(props.precompiled),
      seed: () => props.seed,
      effect: () => props.effect,
      defaultSelectedDataKey: merged.defaultSelectedDataKey,
      onSelectionChange: (key) => props.onSelectionChange?.(key),
    })

    const onMove = (clientX: number) => {
      const node = el
      if (!node) return
      const rect = node.getBoundingClientRect()
      const px = clientX - rect.left - margins().left
      const index = ctx.indexAtX(px)
      ctx.setHoverIndex(index)
      ctx.setCursorX(clientX - rect.left)
      props.onHoverChange?.(index)
    }

    return (
      <ChartContext.Provider value={ctx}>
        <CommonChartContext.Provider value={ctx.common}>
          <div
            {...rest}
            ref={(node) => (el = node)}
            class={cn(styles.frame, props.xstyle, props.class)}
            onPointerEnter={(e) => {
              ctx.setMouseInChart(true)
              also(rest.onPointerEnter, e)
            }}
            onPointerMove={(e) => {
              if (props.interactive) onMove(e.clientX)
              also(rest.onPointerMove, e)
            }}
            onPointerLeave={(e) => {
              ctx.setMouseInChart(false)
              ctx.setHoverIndex(null)
              props.onHoverChange?.(null)
              also(rest.onPointerLeave, e)
            }}
          >
            <ChartLayers
              width={size().width}
              height={size().height}
              transform={`translate(${margins().left},${margins().top})`}
              ready={ctx.ready}
              canvas={canvas}
            >
              {props.children}
            </ChartLayers>
          </div>
        </CommonChartContext.Provider>
      </ChartContext.Provider>
    )
  }
}
