import { createEffect, createMemo, type JSX, mergeProps, onCleanup, Show } from "solid-js"
import { type SeriesKind, type StrokeVariant, useChartPart, type VariantInput } from "./runtime/chart-context"
import { SeriesContext } from "./runtime/series-context"

export type CartesianSeriesProps = {
  part: string
  kind: SeriesKind
  dataKey: string
  variant?: VariantInput
  strokeVariant?: StrokeVariant
  isClickable?: boolean
  opacity?: number
  children?: JSX.Element
}

export default function CartesianSeries(raw: CartesianSeriesProps) {
  const props = mergeProps(
    { variant: "gradient" as VariantInput, strokeVariant: "solid" as StrokeVariant, isClickable: false, opacity: 1 },
    raw,
  )

  const ctx = useChartPart(props.part, props.kind === "line" ? "line" : "area")

  if (import.meta.env.DEV && !ctx.config[props.dataKey]) {
    console.warn(
      `<${props.part} dataKey="${props.dataKey}" />: "${props.dataKey}" is not in the chart \`config\`. Add it so the series has a colour and label.`,
    )
  }

  createEffect(() =>
    ctx.registerSeries({
      dataKey: props.dataKey,
      kind: props.kind,
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
      const e = ctx.selectedDataKey ?? ctx.focusDataKey
      return e !== null && e !== props.dataKey
    },
  }

  const band = createMemo(() => ctx.bands[props.dataKey])
  const hitPath = createMemo(() => {
    const b = band()
    if (!props.isClickable || !b) return null
    const parts: string[] = []
    b.forEach((pt, i) => {
      parts.push(`${i === 0 ? "M" : "L"}${ctx.xCenter(i)},${ctx.y(pt[1])}`)
    })
    for (let i = b.length - 1; i >= 0; i -= 1) {
      parts.push(`L${ctx.xCenter(i)},${ctx.y(b[i][0])}`)
    }
    return `${parts.join(" ")} Z`
  })

  function onClick() {
    if (!props.isClickable) return
    ctx.selectDataKey(ctx.selectedDataKey === props.dataKey ? null : props.dataKey)
  }

  return (
    <SeriesContext.Provider value={series}>
      <Show when={ctx.ready && band()}>
        <g>
          <Show when={hitPath()}>
            {(d) => <path d={d()} fill="transparent" style={{ cursor: "pointer" }} onClick={onClick} />}
          </Show>
          {props.children}
        </g>
      </Show>
    </SeriesContext.Provider>
  )
}
