import RadarFrame from "./RadarFrame"
import { RadarPlot } from "./runtime/polar-plot"
import { definePolarChart } from "./polar-root"

/** Composable dither **radar** chart. Compose `<Radar>` series, `<Legend>`, … inside. */
export const RadarChart = definePolarChart("radar", RadarPlot, RadarFrame)
