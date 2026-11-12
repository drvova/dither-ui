import { createMemo, Index, mergeProps, Show } from "solid-js"
import { dotPaint, type DotVariant } from "../engine/dot-paint"
import { useChart } from "./runtime/chart-context"
import { useSeries } from "./runtime/series-context"

export type DotProps = { variant?: DotVariant; r?: number }

export default function Dot(raw: DotProps) {
  const props = mergeProps({ variant: "border" as DotVariant, r: 2 }, raw)

  const ctx = useChart()
  const series = useSeries("Dot")
  const band = createMemo(() => ctx.bands[series.dataKey])
  const paint = createMemo(() => dotPaint(props.variant, series.seed))

  return (
    <Show when={ctx.ready && band()}>
      {(b) => (
        <g
          style={{
            opacity: ctx.entranceDone ? 1 : 0,
            transition: "opacity 300ms ease",
          }}
        >
          <Index each={b()}>
            {(pt, i) => (
              <circle
                fill={paint().fill}
                stroke={paint().stroke}
                stroke-width={paint().strokeWidth}
                cx={ctx.xCenter(i) ?? 0}
                cy={ctx.y(pt()[1])}
                r={props.r}
              />
            )}
          </Index>
        </g>
      )}
    </Show>
  )
}
