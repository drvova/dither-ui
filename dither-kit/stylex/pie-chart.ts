// Generated from ../tailwind/pie-chart.ts by src/shared/lib/stylex-layer.ts: edit that
// file, then npx rs test -u tests/stylex-layer.spec.ts
import { PieCanvas } from "../engine/pie-canvas"
import { definePolarChart } from "./polar-root"

/** Composable dither **pie / donut** chart. Compose `<Pie>`, `<Legend>`, … inside. */
export const PieChart = definePolarChart("pie", PieCanvas)
