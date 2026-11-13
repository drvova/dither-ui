// Generated from ../solid/Pie.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createEffect, mergeProps, onCleanup } from "solid-js"
import type { VariantInput } from "../solid/runtime/chart-context"
import { usePolarPart } from "../solid/runtime/polar-context"

export type PieProps = { variant?: VariantInput }

export default function Pie(raw: PieProps) {
  const props = mergeProps({ variant: "gradient" as VariantInput }, raw)

  const ctx = usePolarPart("Pie", "pie")

  createEffect(() => ctx.registerVariant("*", props.variant))
  onCleanup(() => ctx.unregisterVariant("*"))

  // Slices are painted on the canvas; this part only registers the variant.
  return <g />
}
