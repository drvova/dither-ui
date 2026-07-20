<script lang="ts" module>
  // Composition metadata: rendered on the DOM overlay layer, above the SVG
  // chrome (Vue's `defineOptions({ chartLayer: "dom" })`).
  export const chartLayer = "dom"
</script>

<script lang="ts">
  import { useCommonChart } from "./common-context"
  import { cn } from "../runtime/lib"
  import { rgb } from "../engine/palette"

  type Props = {
    isClickable?: boolean
    align?: "left" | "center" | "right"
  }
  let { isClickable = false, align = "right" }: Props = $props()

  const chart = useCommonChart()

  function dimmed(name: string): boolean {
    const emphasis = chart.selectedDataKey ?? chart.focusDataKey
    return emphasis !== null && emphasis !== name
  }
</script>

<div
  class={cn(
    "pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-wrap gap-3 px-1",
    align === "right" && "justify-end",
    align === "center" && "justify-center",
    align === "left" && "justify-start"
  )}
>
  {#each chart.names as name (name)}
    <button
      type="button"
      disabled={!isClickable}
      class={cn(
        "flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-opacity",
        isClickable && "pointer-events-auto cursor-pointer hover:text-foreground",
        dimmed(name) && "opacity-40"
      )}
      onclick={() => chart.selectDataKey(chart.selectedDataKey === name ? null : name)}
      onpointerenter={() => chart.setFocusDataKey(name)}
      onpointerleave={() => chart.setFocusDataKey(null)}
      onfocus={() => chart.setFocusDataKey(name)}
      onblur={() => chart.setFocusDataKey(null)}
    >
      <span class="size-2 rounded-[1px]" style:background-color={rgb(chart.seedOf(name).fill)}></span>
      {chart.labelOf(name)}
    </button>
  {/each}
</div>
