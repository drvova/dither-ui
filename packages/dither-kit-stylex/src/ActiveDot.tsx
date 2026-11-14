// Generated from @dither-ui/kit/solid/ActiveDot.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, mergeProps, Show } from "solid-js"
import { dotPaint, type DotVariant } from "@dither-ui/kit/engine/dot-paint.ts"
import { rgb } from "@dither-ui/kit/engine/palette.ts"
import { useChart } from "@dither-ui/kit/solid/runtime/chart-context.ts"
import { useSeries } from "@dither-ui/kit/solid/runtime/series-context.ts"

export type ActiveDotProps = { variant?: DotVariant; r?: number }

export default function ActiveDot(raw: ActiveDotProps) {
  const props = mergeProps({ variant: "colored-border" as DotVariant, r: 3 }, raw)

  const ctx = useChart()
  const series = useSeries("ActiveDot")
  const band = createMemo(() => ctx.bands[series.dataKey])
  const point = createMemo(() => {
    const b = band()
    if (!ctx.ready || !b || ctx.hoverIndex == null || !ctx.entranceDone) return null
    const at = b[ctx.hoverIndex]
    if (!at) return null
    return { cx: ctx.xCenter(ctx.hoverIndex), cy: ctx.y(at[1]) }
  })
  const paint = createMemo(() => dotPaint(props.variant, series.seed))
  const halo = createMemo(() => rgb(series.seed.line, 1, 0.18))

  return (
    <Show when={point()}>
      {(pt) => (
        <g>
          <circle cx={pt().cx} cy={pt().cy} r={props.r + 3} fill={halo()} />
          <circle cx={pt().cx} cy={pt().cy} r={props.r} fill={paint().fill} stroke={paint().stroke} stroke-width={2} />
        </g>
      )}
    </Show>
  )
}
