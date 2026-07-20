<script lang="ts" module>
  import type { ChartConfig, Margins } from "./chart-context"
  import type { BloomInput, EasingInput } from "./dither-paint"
  import type { PrecompiledDither } from "./precompile"
  import type { StackType } from "./scales"

  type Row = Record<string, unknown>

  /** Public props of the cartesian chart roots (area / line / bar). The concrete
   * roots bake in `chartType`; consumers pass data/config + composition. */
  export type CartesianChartProps = {
    data: Row[]
    config: ChartConfig
    stackType?: StackType
    margins?: Partial<Margins>
    class?: string
    animate?: boolean
    /** Master seed — derives duration, delay, easing, stagger, sparkle
     * character and bloom for every prop the consumer left unset. */
    seed?: number
    /** Dedicated edge-effect seed — pins the live-edge motion independent of
     * the master seed. Unset: falls back to the master seed, then sparkle. */
    effect?: number
    animationDuration?: number
    animationDelay?: number
    easing?: EasingInput
    sparkles?: boolean
    hoverLift?: boolean
    stagger?: number
    cell?: number
    sparkleDensity?: number
    sparkleSpeed?: number
    barGap?: number
    barEdge?: number
    glowSize?: number
    hoverStrength?: number
    dimOpacity?: number
    crosshair?: boolean
    replayToken?: number
    interactive?: boolean
    markerIndex?: number | null
    hovered?: boolean
    bloom?: BloomInput
    bloomOnHover?: boolean
    precompiled?: PrecompiledDither
    defaultSelectedDataKey?: string | null
    onHoverChange?: (index: number | null) => void
    onSelectionChange?: (key: string | null) => void
  }

  const DEFAULT_MARGINS: Margins = { top: 10, right: 12, bottom: 22, left: 36 }
</script>

<script lang="ts">
  import { untrack, type Snippet } from "svelte"
  import BarCanvas from "./BarCanvas.svelte"
  import CartesianCanvas from "./CartesianCanvas.svelte"
  import { setChart, type ChartType } from "./chart-context"
  import { useChartController } from "./chart-controller.svelte"
  import { setCommonChart } from "./common-context"
  import {
    bloomFromSeed,
    easingFromSeed,
    geometryFromSeed,
    motionFromSeed,
  } from "./dither-paint"
  import { cn } from "./lib"
  import { precompiledSrc } from "./precompile"
  import { chartDimensions, type Dimensions } from "./use-chart-dimensions"

  type Props = CartesianChartProps & {
    chartType: ChartType
    children?: Snippet
  }

  let {
    chartType,
    data,
    config,
    stackType = "default",
    margins: marginsProp,
    class: className,
    animate = true,
    seed,
    effect,
    animationDuration,
    animationDelay,
    easing,
    sparkles = true,
    hoverLift = true,
    stagger,
    cell = 2,
    sparkleDensity,
    sparkleSpeed,
    barGap,
    barEdge,
    glowSize,
    hoverStrength,
    dimOpacity,
    crosshair = true,
    replayToken = 0,
    interactive = true,
    markerIndex = null,
    hovered = false,
    bloom,
    bloomOnHover = false,
    precompiled: precompiledProp,
    defaultSelectedDataKey = null,
    onHoverChange,
    onSelectionChange,
    children,
  }: Props = $props()

  let size = $state<Dimensions>({ width: 0, height: 0 })
  let rootEl = $state<HTMLDivElement | null>(null)

  const mergedMargins = $derived<Margins>({ ...DEFAULT_MARGINS, ...marginsProp })
  const seeded = $derived(seed !== undefined ? motionFromSeed(seed) : null)
  const geo = $derived(seed !== undefined ? geometryFromSeed(seed) : null)

  const ctx = useChartController({
    // chartType is static per root instance (baked by the wrapper).
    chartType: untrack(() => chartType),
    data: () => data,
    config: () => config,
    stackType: () => stackType,
    dimensions: () => size,
    margins: () => mergedMargins,
    animate: () => animate,
    // Explicit prop > master-seed derivation > house default.
    animationDuration: () => animationDuration ?? seeded?.duration ?? 900,
    animationDelay: () => animationDelay ?? seeded?.delay ?? 0,
    easing: () =>
      easing ??
      (seed !== undefined
        ? easingFromSeed(seed)
        : chartType === "bar"
          ? "ease-out"
          : "ease-in-out"),
    sparkles: () => sparkles,
    hoverLift: () => hoverLift,
    stagger: () => stagger ?? seeded?.stagger ?? 0.55,
    cell: () => cell,
    sparkleDensity: () => sparkleDensity ?? seeded?.sparkleDensity ?? 1,
    sparkleSpeed: () => sparkleSpeed ?? seeded?.sparkleSpeed ?? 1,
    barGap: () => barGap ?? geo?.barGap ?? 0.28,
    barEdge: () => barEdge ?? geo?.barEdge ?? 0.18,
    glowSize: () => glowSize ?? geo?.glowSize ?? 0.16,
    hoverStrength: () => hoverStrength ?? geo?.hoverStrength ?? 1,
    dimOpacity: () => dimOpacity ?? geo?.dimOpacity ?? 0.3,
    crosshair: () => crosshair,
    replayToken: () => replayToken,
    markerIndex: () => markerIndex,
    hovered: () => hovered,
    bloom: () => bloom ?? (seed !== undefined ? bloomFromSeed(seed) : "off"),
    bloomOnHover: () => bloomOnHover,
    precompiled: () => precompiledSrc(precompiledProp),
    seed: () => seed,
    effect: () => effect,
    // Captured once at construction, matching the Vue setup semantics.
    defaultSelectedDataKey: untrack(() => defaultSelectedDataKey),
    onSelectionChange: untrack(() => onSelectionChange),
  })

  setChart(ctx)
  setCommonChart(ctx.common)

  const onSize = (s: Dimensions) => {
    size = s
  }

  function onMove(e: PointerEvent) {
    if (!interactive || !rootEl) return
    const rect = rootEl.getBoundingClientRect()
    const px = e.clientX - rect.left - mergedMargins.left
    const index = ctx.indexAtX(px)
    ctx.setHoverIndex(index)
    ctx.setCursorX(e.clientX - rect.left)
    onHoverChange?.(index)
  }
  function onLeave() {
    ctx.setMouseInChart(false)
    ctx.setHoverIndex(null)
    onHoverChange?.(null)
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
  {#if chartType === "bar"}
    <BarCanvas />
  {:else}
    <CartesianCanvas />
  {/if}
  {@render children?.()}
</div>
