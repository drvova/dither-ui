<script lang="ts" module>
  export type TooltipVariant = "default" | "frosted-glass"
  // Composition metadata: rendered on the DOM overlay layer, above the SVG
  // chrome (Vue's `defineOptions({ chartLayer: "dom" })`).
  export const chartLayer = "dom"
</script>

<script lang="ts">
  import { fade } from "svelte/transition"
  import { useCommonChart } from "./common-context"
  import { cn } from "../runtime/lib"
  import { rgb } from "../engine/palette"

  type Props = {
    labelKey?: string
    valueFormatter?: (value: number, name: string) => string
    variant?: TooltipVariant
  }
  let { labelKey, valueFormatter, variant = "default" }: Props = $props()

  const VARIANT: Record<TooltipVariant, string> = {
    default: "bg-popover",
    "frosted-glass": "bg-popover/70 backdrop-blur-sm",
  }

  const chart = useCommonChart()
  const show = $derived(chart.ready && chart.hoverIndex != null)

  // Retain the last hovered index so the card keeps its content while fading out.
  let lastIndex = 0
  const index = $derived.by(() => {
    const hi = chart.hoverIndex
    if (hi != null) lastIndex = hi
    return hi ?? lastIndex
  })
  const heading = $derived(chart.heading(index, labelKey))
  const items = $derived(chart.itemsAt(index))
</script>

{#if show && items.length > 0}
  <div
    class="dk-tooltip-card {cn(
      'pointer-events-none absolute z-30 rounded-md border px-2 py-1 shadow-sm',
      VARIANT[variant]
    )}"
    style:top="{chart.tooltipTop}px"
    style:left="{chart.tooltipLeft}px"
    style:transform="translate(-50%, -115%)"
    transition:fade={{ duration: 180 }}
  >
    {#if heading}
      <div class="mb-0.5 font-mono text-[10px] text-muted-foreground">{heading}</div>
    {/if}
    <div class="flex flex-col gap-0.5">
      {#each items as item (item.name)}
        <div
          class="flex items-center gap-1.5 font-mono text-[11px] text-popover-foreground tabular-nums"
          style:opacity={item.dimmed ? 0.4 : 1}
        >
          <span class="size-2 rounded-[1px]" style:background-color={rgb(item.seed.fill)}></span>
          <span class="text-muted-foreground">{item.label}</span>
          <span class="ml-auto pl-2 text-foreground">
            {valueFormatter
              ? valueFormatter(item.value, item.name)
              : item.value.toLocaleString()}
          </span>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  /* Glide between points (top/left) with a spring-ish curve; fade via the
     Svelte `fade` transition — native CSS, no dependency. */
  .dk-tooltip-card {
    transition:
      top 260ms cubic-bezier(0.22, 1, 0.36, 1),
      left 260ms cubic-bezier(0.22, 1, 0.36, 1);
  }
</style>
