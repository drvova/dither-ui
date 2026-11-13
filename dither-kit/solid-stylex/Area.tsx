// Generated from ../solid/Area.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import type { JSX } from "solid-js"
import CartesianSeries from "./CartesianSeries"
import type { StrokeVariant, VariantInput } from "../solid/runtime/chart-context"

export type AreaProps = {
  dataKey: string
  variant?: VariantInput
  strokeVariant?: StrokeVariant
  isClickable?: boolean
  opacity?: number
  children?: JSX.Element
}

export default function Area(props: AreaProps) {
  return <CartesianSeries part="Area" kind="area" {...props} />
}
