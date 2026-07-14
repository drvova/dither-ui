import { PieCanvas } from "./pie-canvas"
import { definePolarChart } from "./polar-root"

/** Composable dither **pie / donut** chart. Compose `<Pie>`, `<Legend>`, … inside. */
export const PieChart = definePolarChart("pie", PieCanvas)
