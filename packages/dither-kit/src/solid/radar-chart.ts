import RadarFrame from "./RadarFrame"
import { RadarCanvas } from "./runtime/radar-canvas"
import { definePolarChart } from "./polar-root"

/** Composable dither **radar** chart. Compose `<Radar>` series, `<Legend>`, … inside. */
export const RadarChart = definePolarChart("radar", RadarCanvas, RadarFrame)
