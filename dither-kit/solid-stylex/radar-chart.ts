// Generated from ../solid/radar-chart.ts by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import RadarFrame from "./RadarFrame"
import { RadarCanvas } from "../solid/runtime/radar-canvas"
import { definePolarChart } from "./polar-root"

/** Composable dither **radar** chart. Compose `<Radar>` series, `<Legend>`, … inside. */
export const RadarChart = definePolarChart("radar", RadarCanvas, RadarFrame)
