import CartesianSeries, { type SeriesProps } from "./CartesianSeries"

export type AreaProps = SeriesProps

export default function Area(props: AreaProps) {
  return <CartesianSeries part="Area" kind="area" {...props} />
}
