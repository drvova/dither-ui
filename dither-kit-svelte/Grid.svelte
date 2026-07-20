<script lang="ts" module>
  // Composition metadata: the chart root renders this part behind the dither
  // canvas (Vue's `defineOptions({ chartLayer: "back" })`).
  export const chartLayer = "back"
</script>

<script lang="ts">
  import { useChartPart } from "./chart-context"

  type Props = {
    horizontal?: boolean
    vertical?: boolean
    strokeDasharray?: string
    tickCount?: number
  }
  let {
    horizontal = true,
    vertical = false,
    strokeDasharray = "3 3",
    tickCount = 4,
  }: Props = $props()

  const ctx = useChartPart("Grid")
</script>

{#if ctx.ready}
  <g class="stroke-border" stroke-dasharray={strokeDasharray}>
    {#if horizontal}
      {#each ctx.y.ticks(tickCount) as t (t)}
        <line x1={0} x2={ctx.plot.width} y1={ctx.y(t)} y2={ctx.y(t)} />
      {/each}
    {/if}
    {#if vertical}
      {#each ctx.data as _row, i (i)}
        <line x1={ctx.xCenter(i) ?? 0} x2={ctx.xCenter(i) ?? 0} y1={0} y2={ctx.plot.height} />
      {/each}
    {/if}
  </g>
{/if}
