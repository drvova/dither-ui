// Generated from ../tailwind/radar-chart.ts by src/shared/lib/stylex-layer.ts: edit that
// file, then npx rs test -u tests/stylex-layer.spec.ts
import RadarFrame from "./RadarFrame.vue"
import { RadarCanvas } from "../engine/radar-canvas"
import { definePolarChart } from "./polar-root"

/** Composable dither **radar** chart. Compose `<Radar>` series, `<Legend>`, … inside. */
export const RadarChart = definePolarChart("radar", RadarCanvas, RadarFrame)
