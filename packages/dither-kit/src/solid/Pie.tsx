import { createComputed, mergeProps, onCleanup } from "solid-js"
import type { VariantInput } from "./runtime/chart-context"
import { usePolarPart } from "./runtime/polar-context"

export type PieProps = { variant?: VariantInput }

export default function Pie(raw: PieProps) {
  const props = mergeProps({ variant: "gradient" as VariantInput }, raw)

  const ctx = usePolarPart("Pie", "pie")

  // Registered as it is made, a server render's print included.
  createComputed(() => ctx.registerVariant("*", props.variant))
  onCleanup(() => ctx.unregisterVariant("*"))

  // Slices are the root's print; this part only registers the variant.
  return <g />
}
