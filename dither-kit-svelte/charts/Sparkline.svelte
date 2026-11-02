<script lang="ts">
  import AreaChart from "./AreaChart.svelte"
  import Area from "./Area.svelte"
  import type { ChartConfig, VariantInput } from "./chart-context"
  import type { BloomInput } from "../engine/dither-paint"
  import type { DitherColor } from "../engine/palette"
  import { cn } from "../runtime/lib"

  type Props = {
    /** Plain numeric series — the common sparkline case. */
    data: number[]
    color: DitherColor
    variant?: VariantInput
    seed?: number
    markerIndex?: number | null
    /** Scrubbable: the pointer marks the nearest point with the chart's own
     * crosshair and `onHoverChange` reports its index (null on leave). The
     * chart is then a slider too: focus it and the arrow keys step through
     * the points (Home and End to the ends, Escape or leaving clears). */
    interactive?: boolean
    /** The slider's name for assistive technology, when interactive. */
    label?: string
    /** Brighten the fill while the pointer is over it. */
    hoverLift?: boolean
    /** The idle particle drift along the line; off, the chart holds still. */
    sparkles?: boolean
    onHoverChange?: (index: number | null) => void
    hovered?: boolean
    bloom?: BloomInput
    bloomOnHover?: boolean
    animate?: boolean
    class?: string
  }

  let {
    data,
    color,
    variant = "gradient",
    seed,
    markerIndex = null,
    interactive = false,
    label = "Series",
    hoverLift = true,
    sparkles = true,
    onHoverChange,
    hovered = false,
    bloom = "off",
    bloomOnHover = false,
    animate = false,
    class: className,
  }: Props = $props()

  const rows = $derived(data.map((v) => ({ v })))
  const config = $derived<ChartConfig>({ v: { color } })

  // The point the keyboard picked: the chart marks it like a hover.
  let keyed = $state<number | null>(null)
  const pick = (i: number | null) => {
    keyed = i
    onHoverChange?.(i)
  }
  function onKey(e: KeyboardEvent) {
    const last = data.length - 1
    if (last < 0) return
    const at = keyed ?? last
    const step: Record<string, number | null> = {
      ArrowLeft: Math.max(0, at - 1),
      ArrowDown: Math.max(0, at - 1),
      ArrowRight: Math.min(last, at + 1),
      ArrowUp: Math.min(last, at + 1),
      Home: 0,
      End: last,
      Escape: null,
    }
    if (!(e.key in step)) return
    e.preventDefault()
    pick(step[e.key] ?? null)
  }
  const shown = $derived(keyed ?? data.length - 1)
  /** A point as a screen reader says it: the value, two decimals at most. */
  const spoken = (v: number | undefined) =>
    v === undefined ? "" : v.toLocaleString("en-US", { maximumFractionDigits: 2 })
</script>

{#snippet chart(cls: string | undefined)}
  <AreaChart
    data={rows}
    {config}
    {interactive}
    {hoverLift}
    {sparkles}
    {onHoverChange}
    {animate}
    {seed}
    markerIndex={keyed ?? markerIndex}
    {hovered}
    {bloom}
    {bloomOnHover}
    margins={{ top: 0, right: 0, bottom: 0, left: 0 }}
    class={cls}
  >
    <Area dataKey="v" {variant} />
  </AreaChart>
{/snippet}

{#if interactive}
  <div
    class={cn("h-full w-full rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
    tabindex="0"
    role="slider"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={data.length - 1}
    aria-valuenow={shown}
    aria-valuetext={spoken(data[shown])}
    onkeydown={onKey}
    onblur={() => keyed !== null && pick(null)}
  >
    {@render chart(undefined)}
  </div>
{:else}
  {@render chart(className)}
{/if}
