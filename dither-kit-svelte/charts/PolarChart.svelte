<script lang="ts" module>
  import type { ChartConfig, Margins } from "./chart-context"
  import type { BloomInput, EasingInput } from "../engine/dither-paint"
  import type { PrecompiledDither } from "../engine/precompile"

  type Row = Record<string, unknown>

  /** Public props of the polar chart roots (pie / radar). The concrete roots
   * bake in `chartType`; consumers pass data/config + composition. */
  export type PolarChartProps = {
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
    precompiled?: PrecompiledDither
    defaultSelectedDataKey?: string | null
    onSelectionChange?: (key: string | null) => void
  }

  const DEFAULT_POLAR_MARGINS: Margins = { top: 22, right: 14, bottom: 14, left: 14 }
</script>

<script lang="ts">
  import { untrack, type Snippet } from "svelte"
  import PieCanvas from "./PieCanvas.svelte"
  import RadarCanvas from "./RadarCanvas.svelte"
  import RadarFrame from "./RadarFrame.svelte"
  import { setCommonChart } from "./common-context"
  import {
    bloomFromSeed,
    easingFromSeed,
    geometryFromSeed,
    motionFromSeed,
  } from "../engine/dither-paint"
  import { cn } from "../runtime/lib"
  import { axisAtAngle, sliceAtAngle } from "./polar"
  import { setPolarChart } from "./polar-context"
  import { usePolarController } from "./polar-controller.svelte"
  import { precompiledSrc } from "../engine/precompile"
  import { chartDimensions, type Dimensions } from "./use-chart-dimensions"

  type Props = PolarChartProps & {
    chartType: "pie" | "radar"
    children?: Snippet
  }

  let {
    chartType,
    data,
    config,
    dataKey = "",
    nameKey,
    innerRadius,
    margins: marginsProp,
    class: className,
    animate = true,
    seed,
    animationDuration,
    animationDelay,
    easing,
    hoverLift = true,
    cell = 2,
    popOut,
    rimWidth,
    falloff,
    hoverStrength,
    dimOpacity,
    startAngle,
    rings,
    replayToken = 0,
    bloom,
    bloomOnHover = false,
    precompiled: precompiledProp,
    defaultSelectedDataKey = null,
    onSelectionChange,
    children,
  }: Props = $props()

  let size = $state<Dimensions>({ width: 0, height: 0 })
  let rootEl = $state<HTMLDivElement | null>(null)

  const mergedMargins = $derived<Margins>({ ...DEFAULT_POLAR_MARGINS, ...marginsProp })
  const seeded = $derived(seed !== undefined ? motionFromSeed(seed) : null)
  const geo = $derived(seed !== undefined ? geometryFromSeed(seed) : null)

  const ctx = usePolarController({
    // chartType is static per root instance (baked by the wrapper).
    chartType: untrack(() => chartType),
    data: () => data,
    config: () => config,
    dataKey: () => dataKey,
    nameKey: () => nameKey,
    innerRadiusRatio: () => innerRadius ?? geo?.innerRadius ?? 0,
    dimensions: () => size,
    margins: () => mergedMargins,
    animate: () => animate,
    // Explicit prop > master-seed derivation > house default.
    animationDuration: () => animationDuration ?? seeded?.duration ?? 900,
    animationDelay: () => animationDelay ?? seeded?.delay ?? 0,
    easing: () =>
      easing ?? (seed !== undefined ? easingFromSeed(seed) : "ease-in-out"),
    hoverLift: () => hoverLift,
    cell: () => cell,
    popOut: () => popOut ?? geo?.popOut ?? 6,
    rimWidth: () => rimWidth ?? geo?.rimWidth ?? 1.4,
    falloff: () => falloff ?? geo?.falloff ?? 0.45,
    hoverStrength: () => hoverStrength ?? geo?.hoverStrength ?? 1,
    dimOpacity: () => dimOpacity ?? geo?.dimOpacity ?? 0.3,
    startAngle: () => startAngle ?? seeded?.startAngle ?? 0,
    rings: () => rings ?? geo?.rings ?? 4,
    replayToken: () => replayToken,
    bloom: () => bloom ?? (seed !== undefined ? bloomFromSeed(seed) : "off"),
    bloomOnHover: () => bloomOnHover,
    precompiled: () => precompiledSrc(precompiledProp),
    // Captured once at construction, matching the Vue setup semantics.
    defaultSelectedDataKey: untrack(() => defaultSelectedDataKey),
    onSelectionChange: untrack(() => onSelectionChange),
  })

  setPolarChart(ctx)
  setCommonChart(ctx.common)

  const onSize = (s: Dimensions) => {
    size = s
  }

  function onMove(e: PointerEvent) {
    if (!rootEl) return
    const rect = rootEl.getBoundingClientRect()
    const m = mergedMargins
    const dx = e.clientX - rect.left - m.left - ctx.center.x
    const dy = e.clientY - rect.top - m.top - ctx.center.y
    const angle = Math.atan2(dy, dx)
    const r = Math.hypot(dx, dy)
    if (chartType === "pie" && ctx.pie) {
      const inside = r <= ctx.outerRadius && r >= ctx.innerRadius
      const i = inside ? sliceAtAngle(ctx.pie, angle) : -1
      ctx.setHoverIndex(i >= 0 ? i : null)
    } else if (ctx.radar) {
      ctx.setHoverIndex(axisAtAngle(ctx.radar.axes, angle))
    }
    ctx.setCursor(e.clientX - rect.left, e.clientY - rect.top)
  }
  function onLeave() {
    ctx.setMouseInChart(false)
    ctx.setHoverIndex(null)
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions (the chart root's pointer handlers drive hover tooltips only; the Legend is the keyboard-accessible interface) -->
<div
  bind:this={rootEl}
  use:chartDimensions={onSize}
  class={cn("relative h-full w-full", className)}
  onpointerenter={() => ctx.setMouseInChart(true)}
  onpointermove={onMove}
  onpointerleave={onLeave}
>
  {#if chartType === "radar"}
    <RadarFrame />
  {/if}
  {#if chartType === "pie"}
    <PieCanvas />
  {:else}
    <RadarCanvas />
  {/if}
  {@render children?.()}
</div>
