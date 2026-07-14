import { COLORS, familyOf } from "@/shared/config"
import { LABEL_KEY } from "./data"
import type { ChartModel, DataRow, SeriesRow } from "./types"

/** A fresh series row with studio defaults (same shape the factory seeds). */
export function createSeriesRow(
  key: string,
  label: string,
  color: SeriesRow["color"]
): SeriesRow {
  return {
    key,
    label,
    color,
    variant: "gradient",
    on: true,
    locked: false,
    isClickable: true,
    dots: { on: false, variant: "border", r: 2 },
    activeDot: { on: false, variant: "colored-border", r: 3 },
    opacity: 1,
  }
}

const uniqueKey = (chart: ChartModel, base: string): string => {
  let key = base
  let n = 2
  while (chart.series.some((s) => s.key === key)) key = `${base}${n++}`
  return key
}

/** Append a data row with a generated label and zeroed series values. */
export function addRow(chart: ChartModel): void {
  const fam = familyOf(chart.type)
  const labelKey = LABEL_KEY[fam]
  const row: DataRow = { [labelKey]: `Row ${chart.rows.length + 1}` }
  if (fam === "pie") {
    // A pie row is a slice — register it as a series too.
    const key = uniqueKey(chart, `slice${chart.rows.length + 1}`)
    row.name = key
    row.value = 10
    chart.series.push(
      createSeriesRow(key, key, COLORS[chart.series.length % COLORS.length])
    )
  } else {
    for (const s of chart.series) row[s.key] = 0
  }
  chart.rows.push(row)
}

/** Remove a data row (and, for pie, its slice series). */
export function removeRow(chart: ChartModel, index: number): void {
  const row = chart.rows[index]
  if (!row) return
  chart.rows.splice(index, 1)
  if (familyOf(chart.type) === "pie") {
    chart.series = chart.series.filter((s) => s.key !== row.name)
  }
}

/** Add a new series (cartesian/radar) with zero values in every row. */
export function addSeries(chart: ChartModel): void {
  const key = uniqueKey(chart, `series${chart.series.length + 1}`)
  chart.series.push(
    createSeriesRow(
      key,
      `Series ${chart.series.length + 1}`,
      COLORS[chart.series.length % COLORS.length]
    )
  )
  for (const row of chart.rows) if (!(key in row)) row[key] = 0
}

/** Rename a pie slice — row.name is also the series key, so keep them synced. */
export function renamePieSlice(chart: ChartModel, index: number, name: string): void {
  const row = chart.rows[index]
  if (!row) return
  const clean = name.trim()
  if (!clean) return
  const old = row.name as string
  if (clean === old) return
  const unique = chart.series.some((s) => s.key === clean)
    ? `${clean}-${index + 1}`
    : clean
  row.name = unique
  const s = chart.series.find((x) => x.key === old)
  if (s) {
    s.key = unique
    s.label = unique
  }
}
