import RadarFrame from "./RadarFrame.vue"
import { RadarCanvas } from "../engine/radar-canvas"
import { definePolarChart } from "./polar-root"

/** Composable dither **radar** chart. Compose `<Radar>` series, `<Legend>`, … inside. */
export const RadarChart = definePolarChart("radar", RadarCanvas, RadarFrame)
