// Generated from dither-kit/solid/Pie.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, mergeProps, onCleanup } from "solid-js"
import type { VariantInput } from "dither-kit/solid/runtime/chart-context.ts"
import { usePolarPart } from "dither-kit/solid/runtime/polar-context.ts"

export type PieProps = { variant?: VariantInput }

export default function Pie(raw: PieProps) {
  const props = mergeProps({ variant: "gradient" as VariantInput }, raw)

  const ctx = usePolarPart("Pie", "pie")

  createEffect(() => ctx.registerVariant("*", props.variant))
  onCleanup(() => ctx.unregisterVariant("*"))

  // Slices are painted on the canvas; this part only registers the variant.
  return <g />
}
