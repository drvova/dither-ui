// Generated from ../solid/Radar.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createEffect, mergeProps, onCleanup } from "solid-js"
import type { VariantInput } from "../solid/runtime/chart-context"
import { usePolarPart } from "../solid/runtime/polar-context"

export type RadarProps = { dataKey: string; variant?: VariantInput }

/** A radar chart's series: registers its texture with the chart, which
 * paints the polygon on its canvas. */
export default function Radar(raw: RadarProps) {
  const props = mergeProps({ variant: "gradient" as VariantInput }, raw)

  const ctx = usePolarPart("Radar", "radar")

  if (import.meta.env.DEV && !ctx.config[props.dataKey]) {
    console.warn(
      `<Radar dataKey="${props.dataKey}" />: "${props.dataKey}" is not in the chart \`config\`. Add it so the series has a colour and label.`,
    )
  }

  createEffect<string | undefined>((old) => {
    const dataKey = props.dataKey
    if (old !== undefined && old !== dataKey) ctx.unregisterVariant(old)
    ctx.registerVariant(dataKey, props.variant)
    return dataKey
  })
  onCleanup(() => ctx.unregisterVariant(props.dataKey))

  // The polygon is painted on the canvas; this part only registers the series.
  return <g />
}
