// The numbers the docs' chart and example demos share: believable
// dashboard figures, not sine waves, written once so a chart, the example
// that composes it and the snippet that prints it all read the same rows.
import type { AreaVariant, DitherColor } from "@dither-ui/kit"

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const revenue = [42, 51, 48, 63, 71, 68, 79, 86, 82, 94, 102, 118]
const expenses = [31, 34, 33, 39, 44, 47, 46, 52, 55, 58, 61, 67]
export const rows = MONTHS.map((month, i) => ({ month, revenue: revenue[i], expenses: expenses[i] }))
export const config = {
  revenue: { label: "Revenue", color: "blue" as DitherColor },
  expenses: { label: "Expenses", color: "purple" as DitherColor },
}

export const trafficRows = MONTHS.slice(0, 8).map((month, i) => ({
  month,
  organic: [820, 932, 901, 1290, 1330, 1320, 1450, 1682][i],
  paid: [420, 532, 501, 654, 690, 720, 810, 932][i],
}))
export const trafficConfig = {
  organic: { label: "Organic", color: "green" as DitherColor },
  paid: { label: "Paid", color: "orange" as DitherColor },
}

export const pieRows = [
  { name: "Chrome", value: 61 },
  { name: "Safari", value: 19 },
  { name: "Firefox", value: 11 },
  { name: "Other", value: 9 },
]
export const pieConfig = {
  Chrome: { label: "Chrome", color: "blue" as DitherColor },
  Safari: { label: "Safari", color: "purple" as DitherColor },
  Firefox: { label: "Firefox", color: "orange" as DitherColor },
  Other: { label: "Other", color: "grey" as DitherColor },
}

export const radarConfig = {
  current: { label: "This sprint", color: "blue" as DitherColor },
  previous: { label: "Last sprint", color: "grey" as DitherColor },
}
export const radarRows = [
  { axis: "shipped", current: 9, previous: 6 },
  { axis: "reviewed", current: 7, previous: 7 },
  { axis: "tested", current: 8, previous: 5 },
  { axis: "documented", current: 6, previous: 3 },
  { axis: "on time", current: 8, previous: 6 },
]

// Stat-card sparklines, the last 24 hours each. Every figure a card states
// is read from the series it plots: the headline is the last hour, the
// delta the change across the day (a falling error rate is the good way).
export const trend = (seed: number, drift: number) =>
  Array.from({ length: 24 }, (_, i) =>
    Number((10 + i * drift + Math.sin(i * 0.8 + seed) * 2 + Math.sin(i * 1.7 + seed * 2) * 1.1).toFixed(1)),
  )
type Unit = { pre: string; scale: number; dec: number; suf: string }
const stat = (label: string, color: DitherColor, data: number[], unit: Unit, lowerIsBetter = false) => {
  const first = data[0] ?? 0
  const last = data[data.length - 1] ?? 0
  const pct = (last / first - 1) * 100
  const read = (v: number) => Number((v * unit.scale).toFixed(unit.dec))
  return {
    label,
    color,
    data,
    unit,
    read,
    value: `${unit.pre}${read(last).toLocaleString("en-US", { minimumFractionDigits: unit.dec })}${unit.suf}`,
    delta: `${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(1)}%`,
    up: lowerIsBetter ? pct < 0 : pct > 0,
  }
}
export const STATS = [
  stat("Revenue", "green", trend(1, 0.35), { pre: "$", scale: 2.4, dec: 1, suf: "k" }),
  stat("Active users", "blue", trend(2, 0.2), { pre: "", scale: 600, dec: 0, suf: "" }),
  stat(
    "Error rate",
    "red",
    trend(3, -0.18).map((v) => Number((v + 8).toFixed(1))),
    { pre: "", scale: 0.03, dec: 2, suf: "%" },
    true,
  ),
]
/** The stat cards as an example declares them: what each card prints. */
export const STAT_ROWS = STATS.map(({ label, value, delta, up, color, data }) => ({
  label,
  value,
  delta,
  up,
  color,
  data,
}))
export const VARIANTS: AreaVariant[] = ["gradient", "dotted", "hatched", "solid"]

export const wave = Array.from({ length: 20 }, (_, i) => 5 + Math.sin(i * 0.6) * 2.2 + Math.sin(i * 1.4) * 1)
export const COLORS: DitherColor[] = ["green", "blue", "purple", "pink", "orange", "red", "grey"]
