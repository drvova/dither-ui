// Generated from dither-kit/solid/YAxis.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { For, mergeProps, Show } from "solid-js"
import { useChartPart } from "dither-kit/solid/runtime/chart-context.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  g: {
    fill: "currentcolor",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--muted-foreground)",
  },
})

export type YAxisProps = {
  tickFormatter?: (value: number) => string
  tickCount?: number
  tickMargin?: number
}

export default function YAxis(raw: YAxisProps) {
  const props = mergeProps({ tickCount: 4, tickMargin: 8 }, raw)

  const ctx = useChartPart("YAxis")

  return (
    <Show when={ctx.ready}>
      <g {...stylex.props(styles.g)}>
        <For each={ctx.y.ticks(props.tickCount)}>
          {(t) => (
            <text x={-props.tickMargin} y={ctx.y(t)} text-anchor="end" dominant-baseline="central" fill="currentColor">
              {props.tickFormatter ? props.tickFormatter(t) : t}
            </text>
          )}
        </For>
      </g>
    </Show>
  )
}
