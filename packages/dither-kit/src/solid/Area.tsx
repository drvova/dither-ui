import type { JSX } from "solid-js"
import CartesianSeries from "./CartesianSeries"
import type { StrokeVariant, VariantInput } from "./runtime/chart-context"

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
