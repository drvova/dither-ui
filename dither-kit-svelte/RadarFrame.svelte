<script lang="ts" module>
  // Composition metadata: the polar root renders this frame behind the dither
  // canvas (Vue's `defineOptions({ chartLayer: "back" })`).
  export const chartLayer = "back"
</script>

<script lang="ts">
  import { polarX, polarY } from "./polar"
  import { usePolarChart } from "./polar-context"

  const ctx = usePolarChart()
  // Ring count comes from the chart context so the root's `rings` prop drives it.
  const LEVELS = $derived(Math.max(1, Math.round(ctx.rings)))

  const axes = $derived(ctx.radar?.axes ?? [])

  function ring(radius: number): string {
    return `${axes
      .map(
        (ax, i) =>
          `${i === 0 ? "M" : "L"}${polarX(ctx.center.x, radius, ax.angle).toFixed(
            1
          )},${polarY(ctx.center.y, radius, ax.angle).toFixed(1)}`
      )
      .join(" ")} Z`
  }

  const rings = $derived(
    Array.from({ length: LEVELS }, (_, l) =>
      ring((ctx.outerRadius * (l + 1)) / LEVELS)
    )
  )

  function anchorOf(angle: number): "start" | "middle" | "end" {
    if (Math.abs(Math.cos(angle)) < 0.3) return "middle"
    return Math.cos(angle) > 0 ? "start" : "end"
  }
</script>

{#if ctx.ready && ctx.radar}
  <g>
    <g class="stroke-border" fill="none">
      {#each rings as d, l (l)}
        <path {d} />
      {/each}
      {#each axes as ax, i (ax.label)}
        <line
          x1={ctx.center.x}
          y1={ctx.center.y}
          x2={polarX(ctx.center.x, ctx.outerRadius, ax.angle)}
          y2={polarY(ctx.center.y, ctx.outerRadius, ax.angle)}
          class={ctx.hoverIndex === i ? "stroke-foreground" : undefined}
        />
      {/each}
    </g>
    <g class="font-mono text-[10px]">
      {#each axes as ax, i (ax.label)}
        <text
          x={polarX(ctx.center.x, ctx.outerRadius + 10, ax.angle)}
          y={polarY(ctx.center.y, ctx.outerRadius + 10, ax.angle)}
          text-anchor={anchorOf(ax.angle)}
          dominant-baseline="central"
          class={ctx.hoverIndex === i ? "fill-foreground" : "fill-muted-foreground"}
        >
          {ax.label}
        </text>
      {/each}
    </g>
  </g>
{/if}
