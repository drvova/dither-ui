import { For, mergeProps, Show } from "solid-js"
import { useChartPart } from "./runtime/chart-context"

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
      <g class="fill-current font-mono text-[10px] text-muted-foreground">
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
