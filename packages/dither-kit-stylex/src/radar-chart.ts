// Generated from @dither-ui/kit/solid/radar-chart.ts by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import RadarFrame from "./RadarFrame"
import { RadarPlot } from "./runtime/polar-plot"
import { definePolarChart } from "./polar-root"

/** Composable dither **radar** chart. Compose `<Radar>` series, `<Legend>`, … inside. */
export const RadarChart = definePolarChart("radar", RadarPlot, RadarFrame)
