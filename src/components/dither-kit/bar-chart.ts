import { BarCanvas } from "./bar-canvas"
import { defineCartesianChart } from "./cartesian-root"

/** Composable dither **bar** chart — `<Bar>` series, grouped or stacked. */
export const BarChart = defineCartesianChart("bar", BarCanvas)
