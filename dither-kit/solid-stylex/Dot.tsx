// Generated from ../solid/Dot.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, Index, mergeProps, Show } from "solid-js"
import { dotPaint, type DotVariant } from "../engine/dot-paint"
import { useChart } from "../solid/runtime/chart-context"
import { useSeries } from "../solid/runtime/series-context"

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
