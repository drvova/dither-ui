import { createEffect, mergeProps, onCleanup } from "solid-js"
import type { VariantInput } from "./runtime/chart-context"
import { usePolarPart } from "./runtime/polar-context"

export type PieProps = { variant?: VariantInput }

export default function Pie(raw: PieProps) {
  const props = mergeProps({ variant: "gradient" as VariantInput }, raw)

  const ctx = usePolarPart("Pie", "pie")

  createEffect(() => ctx.registerVariant("*", props.variant))
  onCleanup(() => ctx.unregisterVariant("*"))

  // Slices are painted on the canvas; this part only registers the variant.
  return <g />
}
