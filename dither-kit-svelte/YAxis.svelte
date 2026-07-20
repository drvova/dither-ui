<script lang="ts">
  import { useChartPart } from "./chart-context"

  type Props = {
    tickFormatter?: (value: number) => string
    tickCount?: number
    tickMargin?: number
  }
  let { tickFormatter, tickCount = 4, tickMargin = 8 }: Props = $props()

  const ctx = useChartPart("YAxis")
</script>

{#if ctx.ready}
  <svg
    class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    style:z-index={20}
    aria-hidden="true"
  >
    <g transform={`translate(${ctx.margins.left},${ctx.margins.top})`}>
      <g class="fill-current font-mono text-[10px] text-muted-foreground">
        {#each ctx.y.ticks(tickCount) as t (t)}
          <text
            x={-tickMargin}
            y={ctx.y(t)}
            text-anchor="end"
            dominant-baseline="central"
            fill="currentColor"
          >
            {tickFormatter ? tickFormatter(t) : t}
          </text>
        {/each}
      </g>
    </g>
  </svg>
{/if}
