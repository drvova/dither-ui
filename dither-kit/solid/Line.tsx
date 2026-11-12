import type { JSX } from "solid-js"
import CartesianSeries from "./CartesianSeries"
import type { StrokeVariant, VariantInput } from "./runtime/chart-context"

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
