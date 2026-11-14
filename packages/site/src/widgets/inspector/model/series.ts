import type { ChartModel, Layer } from "@/entities/chart"

/** The series a series layer stands for, read by its key; none for any other layer. */
export function layerSeries(chart: ChartModel | null | undefined, layer: Layer | undefined) {
  const key = layer?.seriesKey
  return key ? chart?.series.find((s) => s.key === key) : undefined
}
