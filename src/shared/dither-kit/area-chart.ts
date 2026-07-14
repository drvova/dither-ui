import { CartesianCanvas } from "./cartesian-canvas"
import { defineCartesianChart } from "./cartesian-root"

/** Composable dither **area** chart. Compose `<Area>`, `<Grid>`, axes, … inside. */
export const AreaChart = defineCartesianChart("area", CartesianCanvas)

/** Composable dither **line** chart — `<Line>` series with a glow under the line. */
export const LineChart = defineCartesianChart("line", CartesianCanvas)
