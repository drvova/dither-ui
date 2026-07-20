<script lang="ts">
  import { useChartPart } from "./chart-context"

  type Props = {
    dataKey?: string
    tickFormatter?: (value: unknown, index: number) => string
    tickMargin?: number
    maxTicks?: number
  }
  let { dataKey, tickFormatter, tickMargin = 8, maxTicks = 8 }: Props = $props()

  const ctx = useChartPart("XAxis")
  const step = $derived(Math.max(1, Math.ceil(ctx.dataLength / maxTicks)))

  function labelAt(row: Record<string, unknown>, i: number): string {
    const raw = dataKey ? row[dataKey] : i
    return tickFormatter ? tickFormatter(raw, i) : String(raw ?? "")
  }
</script>

{#if ctx.ready}
  <svg
    class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    style:z-index={20}
    aria-hidden="true"
  >
    <g transform={`translate(${ctx.margins.left},${ctx.margins.top})`}>
      <g class="fill-current font-mono text-[10px] text-muted-foreground">
        {#each ctx.data as row, i (i)}
          {#if i % step === 0}
            <text
              x={ctx.xCenter(i) ?? 0}
              y={ctx.plot.height + tickMargin}
              text-anchor="middle"
              dominant-baseline="hanging"
              fill="currentColor"
            >
              {labelAt(row as Record<string, unknown>, i)}
            </text>
          {/if}
        {/each}
      </g>
    </g>
  </svg>
{/if}
