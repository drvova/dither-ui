// Generated from dither-kit/solid/Dot.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, Index, mergeProps, Show } from "solid-js"
import { dotPaint, type DotVariant } from "dither-kit/engine/dot-paint.ts"
import { useChart } from "dither-kit/solid/runtime/chart-context.ts"
import { useSeries } from "dither-kit/solid/runtime/series-context.ts"

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
