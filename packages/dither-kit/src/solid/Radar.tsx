import { createComputed, mergeProps, onCleanup } from "solid-js"
import type { VariantInput } from "./runtime/chart-context"
import { usePolarPart } from "./runtime/polar-context"

export type RadarProps = { dataKey: string; variant?: VariantInput }

/** A radar chart's series: registers its texture with the chart, which
 * prints the polygon. */
export default function Radar(raw: RadarProps) {
  const props = mergeProps({ variant: "gradient" as VariantInput }, raw)

  const ctx = usePolarPart("Radar", "radar")

  if (import.meta.env.DEV && !ctx.config[props.dataKey]) {
    console.warn(
      `<Radar dataKey="${props.dataKey}" />: "${props.dataKey}" is not in the chart \`config\`. Add it so the series has a colour and label.`,
    )
  }

  // Registered as it is made, a server render's print included.
  createComputed<string | undefined>((old) => {
    const dataKey = props.dataKey
    if (old !== undefined && old !== dataKey) ctx.unregisterVariant(old)
    ctx.registerVariant(dataKey, props.variant)
    return dataKey
  })
  onCleanup(() => ctx.unregisterVariant(props.dataKey))

  // The polygon is the root's print; this part only registers the series.
  return <g />
}
