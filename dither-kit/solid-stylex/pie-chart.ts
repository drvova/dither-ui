// Generated from ../solid/pie-chart.ts by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { PieCanvas } from "../solid/runtime/pie-canvas"
import { definePolarChart } from "./polar-root"

/** Composable dither **pie / donut** chart. Compose `<Pie>`, `<Legend>`, … inside. */
export const PieChart = definePolarChart("pie", PieCanvas)
