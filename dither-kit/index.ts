// Public API for Dither Kit (Vue). Mirrors the React kit's surface.

export { default as Area } from "./Area.vue"
export { default as Line } from "./Line.vue"
export { AreaChart, LineChart } from "./area-chart"
export { default as Bar } from "./Bar.vue"
export { BarChart } from "./bar-chart"
export { default as Pie } from "./Pie.vue"
export { PieChart } from "./pie-chart"
export { default as Radar } from "./Radar.vue"
export { RadarChart } from "./radar-chart"
export { default as RadarFrame } from "./RadarFrame.vue"

export { default as Grid } from "./Grid.vue"
export { default as XAxis } from "./XAxis.vue"
export { default as YAxis } from "./YAxis.vue"
export { default as Dot } from "./Dot.vue"
export { default as ActiveDot } from "./ActiveDot.vue"
export { default as Legend } from "./Legend.vue"
export { default as Tooltip, type TooltipVariant } from "./Tooltip.vue"
export { default as Sparkline } from "./Sparkline.vue"

export { default as DitherAvatar, type AvatarMirror } from "./DitherAvatar.vue"
export { default as DitherButton, type ButtonVariant } from "./DitherButton.vue"
export {
  default as DitherGradient,
  type GradientDirection,
} from "./DitherGradient.vue"

export type { CartesianChartProps } from "./cartesian-root"
export type { PolarChartProps } from "./polar-root"
export type {
  AreaVariant,
  ChartConfig,
  ChartType,
  Margins,
  SeriesKind,
  StrokeVariant,
} from "./chart-context"
export type {
  BloomBlend,
  BloomConfig,
  BloomInput,
  BloomLevel,
} from "./dither-paint"
export type { DotVariant } from "./dot-paint"
export type { DitherColor } from "./palette"
export { cssColor, seedFromColor, seedFromHue } from "./palette"
export type { PixelBloom, PixelColor } from "./pixel"
export type { StackType } from "./scales"
