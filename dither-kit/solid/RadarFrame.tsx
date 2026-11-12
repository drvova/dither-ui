import { createMemo, For, Index, Show } from "solid-js"
import { polarX, polarY } from "../engine/polar"
import { chartLayer } from "./runtime/chart-layer"
import { usePolarChart } from "./runtime/polar-context"

export type RadarFrameProps = Record<never, never>

export default function RadarFrame(_props: RadarFrameProps) {
  const ctx = usePolarChart()
  // Ring count comes from the chart context so the root's `rings` prop drives it.
  const LEVELS = createMemo(() => Math.max(1, Math.round(ctx.rings)))

  const axes = createMemo(() => ctx.radar?.axes ?? [])

  function ring(radius: number): string {
    return `${axes()
      .map(
        (ax, i) =>
          `${i === 0 ? "M" : "L"}${polarX(ctx.center.x, radius, ax.angle).toFixed(
            1,
          )},${polarY(ctx.center.y, radius, ax.angle).toFixed(1)}`,
      )
      .join(" ")} Z`
  }

  const rings = createMemo(() =>
    Array.from({ length: LEVELS() }, (_, l) => ring((ctx.outerRadius * (l + 1)) / LEVELS())),
  )

  function anchorOf(angle: number): "start" | "middle" | "end" {
    if (Math.abs(Math.cos(angle)) < 0.3) return "middle"
    return Math.cos(angle) > 0 ? "start" : "end"
  }

  return chartLayer(
    "back",
    <Show when={ctx.ready && ctx.radar}>
      <g>
        <g class="stroke-border" fill="none">
          <Index each={rings()}>{(d) => <path d={d()} />}</Index>
          <For each={axes()}>
            {(ax, i) => (
              <line
                x1={ctx.center.x}
                y1={ctx.center.y}
                x2={polarX(ctx.center.x, ctx.outerRadius, ax.angle)}
                y2={polarY(ctx.center.y, ctx.outerRadius, ax.angle)}
                class={ctx.hoverIndex === i() ? "stroke-foreground" : undefined}
              />
            )}
          </For>
        </g>
        <g class="font-mono text-[10px]">
          <For each={axes()}>
            {(ax, i) => (
              <text
                x={polarX(ctx.center.x, ctx.outerRadius + 10, ax.angle)}
                y={polarY(ctx.center.y, ctx.outerRadius + 10, ax.angle)}
                text-anchor={anchorOf(ax.angle)}
                dominant-baseline="central"
                class={ctx.hoverIndex === i() ? "fill-foreground" : "fill-muted-foreground"}
              >
                {ax.label}
              </text>
            )}
          </For>
        </g>
      </g>
    </Show>,
  )
}
