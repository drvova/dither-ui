// Generated from dither-kit/solid/Line.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import type { JSX } from "solid-js"
import CartesianSeries from "./CartesianSeries"
import type { StrokeVariant, VariantInput } from "dither-kit/solid/runtime/chart-context.ts"

export type LineProps = {
  dataKey: string
  variant?: VariantInput
  strokeVariant?: StrokeVariant
  isClickable?: boolean
  opacity?: number
  children?: JSX.Element
}

export default function Line(props: LineProps) {
  return <CartesianSeries part="Line" kind="line" {...props} />
}
