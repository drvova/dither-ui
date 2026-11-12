import { For, Index, mergeProps, Show } from "solid-js"
import { useChartPart } from "./runtime/chart-context"
import { chartLayer } from "./runtime/chart-layer"

export type GridProps = {
  horizontal?: boolean
  vertical?: boolean
  strokeDasharray?: string
  tickCount?: number
}

export default function Grid(raw: GridProps) {
  const props = mergeProps({ horizontal: true, vertical: false, strokeDasharray: "3 3", tickCount: 4 }, raw)

  const ctx = useChartPart("Grid")

  return chartLayer(
    "back",
    <Show when={ctx.ready}>
      <g class="stroke-border" stroke-dasharray={props.strokeDasharray}>
        <Show when={props.horizontal}>
          <For each={ctx.y.ticks(props.tickCount)}>
            {(t) => <line x1={0} x2={ctx.plot.width} y1={ctx.y(t)} y2={ctx.y(t)} />}
          </For>
        </Show>
        <Show when={props.vertical}>
          <Index each={ctx.data}>
            {(_, i) => <line x1={ctx.xCenter(i) ?? 0} x2={ctx.xCenter(i) ?? 0} y1={0} y2={ctx.plot.height} />}
          </Index>
        </Show>
      </g>
    </Show>,
  )
}
