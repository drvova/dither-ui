// Generated from dither-kit/solid/Bar.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, Index, type JSX, mergeProps, onCleanup, Show } from "solid-js"
import { type StrokeVariant, useChartPart, type VariantInput } from "dither-kit/solid/runtime/chart-context.ts"
import { SeriesContext } from "dither-kit/solid/runtime/series-context.ts"

export type BarProps = {
  dataKey: string
  variant?: VariantInput
  strokeVariant?: StrokeVariant
  isClickable?: boolean
  opacity?: number
  children?: JSX.Element
}

export default function Bar(raw: BarProps) {
  const props = mergeProps(
    { variant: "gradient" as VariantInput, strokeVariant: "solid" as StrokeVariant, isClickable: false, opacity: 1 },
    raw,
  )

  const ctx = useChartPart("Bar", "bar")

  if (import.meta.env.DEV && !ctx.config[props.dataKey]) {
    console.warn(
      `<Bar dataKey="${props.dataKey}" />: "${props.dataKey}" is not in the chart \`config\`. Add it so the series has a colour and label.`,
    )
  }

  createEffect(() =>
    ctx.registerSeries({
      dataKey: props.dataKey,
      kind: "bar",
      variant: props.variant,
      strokeVariant: props.strokeVariant,
      opacity: props.opacity,
    }),
  )
  onCleanup(() => ctx.unregisterSeries(props.dataKey))

  const series = {
    get dataKey() {
      return props.dataKey
    },
    get seed() {
      return ctx.seedOf(props.dataKey)
    },
    get dimmed() {
      return ctx.selectedDataKey !== null && ctx.selectedDataKey !== props.dataKey
    },
  }

  const band = createMemo(() => ctx.bands[props.dataKey])
  const si = createMemo(() => ctx.configKeys.indexOf(props.dataKey))
  const rects = createMemo(() => {
    const b = band()
    if (!props.isClickable || !b) return []
    const n = ctx.configKeys.length
    return b.map((pt, i) => {
      const slot = ctx.barSlot(i, si(), n)
      const top = ctx.y(pt[1])
      const base = ctx.y(pt[0])
      return {
        x: slot.x,
        y: Math.min(top, base),
        width: slot.width,
        height: Math.abs(base - top),
      }
    })
  })

  function onClick() {
    ctx.selectDataKey(ctx.selectedDataKey === props.dataKey ? null : props.dataKey)
  }

  return (
    <SeriesContext.Provider value={series}>
      <Show when={ctx.ready && band()}>
        <g>
          <Index each={rects()}>
            {(r) => (
              <rect
                x={r().x}
                y={r().y}
                width={r().width}
                height={r().height}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onClick={onClick}
              />
            )}
          </Index>
          {props.children}
        </g>
      </Show>
    </SeriesContext.Provider>
  )
}
