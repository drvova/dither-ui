// Generated from dither-kit/solid/area-chart.ts by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { CartesianCanvas } from "dither-kit/solid/runtime/cartesian-canvas.tsx"
import { defineCartesianChart } from "./cartesian-root"

/** Composable dither **area** chart. Compose `<Area>`, `<Grid>`, axes, … inside. */
export const AreaChart = defineCartesianChart("area", CartesianCanvas)

/** Composable dither **line** chart — `<Line>` series with a glow under the line. */
export const LineChart = defineCartesianChart("line", CartesianCanvas)
