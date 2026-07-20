<script lang="ts">
  import { useChart } from "./chart-context"
  import { dotPaint, type DotVariant } from "./dot-paint"
  import { rgb } from "./palette"
  import { useSeries } from "./series-context"

  type Props = { variant?: DotVariant; r?: number }
  let { variant = "colored-border", r = 3 }: Props = $props()

  const ctx = useChart()
  const series = useSeries("ActiveDot")
  const band = $derived(ctx.bands[series.dataKey])
  const point = $derived.by(() => {
    if (!ctx.ready || !band || ctx.hoverIndex == null || !ctx.entranceDone) return null
    const b = band[ctx.hoverIndex]
    if (!b) return null
    return { cx: ctx.xCenter(ctx.hoverIndex), cy: ctx.y(b[1]) }
  })
  const paint = $derived(dotPaint(variant, series.seed))
  const halo = $derived(rgb(series.seed.line, 1, 0.18))
</script>

{#if point}
  <svg
    class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    style:z-index={20}
    aria-hidden="true"
  >
    <g transform={`translate(${ctx.margins.left},${ctx.margins.top})`}>
      <circle cx={point.cx} cy={point.cy} r={r + 3} fill={halo} />
      <circle cx={point.cx} cy={point.cy} {r} fill={paint.fill} stroke={paint.stroke} stroke-width={2} />
    </g>
  </svg>
{/if}
