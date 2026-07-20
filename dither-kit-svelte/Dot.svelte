<script lang="ts">
  import { useChart } from "./chart-context"
  import { dotPaint, type DotVariant } from "./dot-paint"
  import { useSeries } from "./series-context"

  type Props = { variant?: DotVariant; r?: number }
  let { variant = "border", r = 2 }: Props = $props()

  const ctx = useChart()
  const series = useSeries("Dot")
  const band = $derived(ctx.bands[series.dataKey])
  const paint = $derived(dotPaint(variant, series.seed))
</script>

{#if ctx.ready && band}
  <g style:opacity={ctx.entranceDone ? 1 : 0} style:transition="opacity 300ms ease">
    {#each band as b, i (i)}
      <circle
        fill={paint.fill}
        stroke={paint.stroke}
        stroke-width={paint.strokeWidth}
        cx={ctx.xCenter(i) ?? 0}
        cy={ctx.y(b[1])}
        {r}
      />
    {/each}
  </g>
{/if}
