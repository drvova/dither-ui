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
  <!-- A key you can press is a button; a plain key is a label, never a
       disabled button. The padding pulled back by the margin gives the
       button a 24px target without moving a pixel. -->
  {#snippet key(name: string)}
    <span class="size-2 rounded-[1px]" style:background-color={rgb(chart.seedOf(name).fill)}></span>
    {chart.labelOf(name)}
  {/snippet}
  {#each chart.names as name (name)}
    {#if isClickable}
      <button
        type="button"
        class={cn(
          "pointer-events-auto -my-1 flex cursor-pointer items-center gap-1.5 py-1 font-mono text-[11px] text-muted-foreground transition-opacity hover:text-foreground",
          dimmed(name) && "opacity-40"
        )}
        onclick={() => chart.selectDataKey(chart.selectedDataKey === name ? null : name)}
        onpointerenter={() => chart.setFocusDataKey(name)}
        onpointerleave={() => chart.setFocusDataKey(null)}
        onfocus={() => chart.setFocusDataKey(name)}
        onblur={() => chart.setFocusDataKey(null)}
      >
        {@render key(name)}
      </button>
    {:else}
      <span
        class={cn(
          "-my-1 flex items-center gap-1.5 py-1 font-mono text-[11px] text-muted-foreground transition-opacity",
          dimmed(name) && "opacity-40"
        )}
      >
        {@render key(name)}
      </span>
    {/if}
  {/each}
</div>
