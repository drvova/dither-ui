// Generated from ../solid/RadarFrame.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, For, Index, Show } from "solid-js"
import { polarX, polarY } from "../engine/polar"
import { chartLayer } from "./runtime/chart-layer"
import { usePolarChart } from "../solid/runtime/polar-context"
import { cn } from "./lib"

import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  g: { stroke: "var(--border)" },
  g2: { fontFamily: "var(--font-mono)", fontSize: "10px" },
  line: { stroke: "var(--foreground)" },
  text: { fill: "var(--foreground)" },
  text2: { fill: "var(--muted-foreground)" },
})

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
        <g {...stylex.props(styles.g)} fill="none">
          <Index each={rings()}>{(d) => <path d={d()} />}</Index>
          <For each={axes()}>
            {(ax, i) => (
              <line
                x1={ctx.center.x}
                y1={ctx.center.y}
                x2={polarX(ctx.center.x, ctx.outerRadius, ax.angle)}
                y2={polarY(ctx.center.y, ctx.outerRadius, ax.angle)}
                class={cn(ctx.hoverIndex === i() ? styles.line : undefined)}
              />
            )}
          </For>
        </g>
        <g {...stylex.props(styles.g2)}>
          <For each={axes()}>
            {(ax, i) => (
              <text
                x={polarX(ctx.center.x, ctx.outerRadius + 10, ax.angle)}
                y={polarY(ctx.center.y, ctx.outerRadius + 10, ax.angle)}
                text-anchor={anchorOf(ax.angle)}
                dominant-baseline="central"
                class={cn(ctx.hoverIndex === i() ? styles.text : styles.text2)}
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
