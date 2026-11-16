import CartesianSeries, { type SeriesProps } from "./CartesianSeries"

export type LineProps = SeriesProps

export default function Line(props: LineProps) {
  return <CartesianSeries part="Line" kind="line" {...props} />
}
