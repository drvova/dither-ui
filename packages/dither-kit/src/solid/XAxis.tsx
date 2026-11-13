import { createMemo, Index, mergeProps, Show } from "solid-js"
import { useChartPart } from "./runtime/chart-context"

export type XAxisProps = {
  dataKey?: string
  tickFormatter?: (value: unknown, index: number) => string
  tickMargin?: number
  maxTicks?: number
}

export default function XAxis(raw: XAxisProps) {
  const props = mergeProps({ tickMargin: 8, maxTicks: 8 }, raw)

  const ctx = useChartPart("XAxis")
  const step = createMemo(() => Math.max(1, Math.ceil(ctx.dataLength / props.maxTicks)))

  function labelAt(row: unknown, i: number): string {
    const raw = props.dataKey ? (row as Record<string, unknown>)[props.dataKey] : i
    return props.tickFormatter ? props.tickFormatter(raw, i) : String(raw ?? "")
  }

  return (
    <Show when={ctx.ready}>
      <g class="fill-current font-mono text-[10px] text-muted-foreground">
        <Index each={ctx.data}>
          {(row, i) => (
            <Show when={i % step() === 0}>
              <text
                x={ctx.xCenter(i) ?? 0}
                y={ctx.plot.height + props.tickMargin}
                text-anchor="middle"
                dominant-baseline="hanging"
                fill="currentColor"
              >
                {labelAt(row(), i)}
              </text>
            </Show>
          )}
        </Index>
      </g>
    </Show>
  )
}
