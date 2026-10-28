// Generated from ../tailwind/bar-chart.ts by src/shared/lib/stylex-layer.ts: edit that
// file, then npx rs test -u tests/stylex-layer.spec.ts
import { BarCanvas } from "../engine/bar-canvas"
import { defineCartesianChart } from "./cartesian-root"

/** Composable dither **bar** chart — `<Bar>` series, grouped or stacked. */
export const BarChart = defineCartesianChart("bar", BarCanvas)
