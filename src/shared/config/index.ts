import type {
  AreaVariant,
  BloomLevel,
  DitherColor,
  EasingName,
  GradientDirection,
  StackType,
} from "@dither-kit"

export type ChartType = "area" | "line" | "bar" | "pie" | "radar"
export type Family = "cartesian" | "pie" | "radar"

export const familyOf = (t: ChartType): Family =>
  t === "pie" ? "pie" : t === "radar" ? "radar" : "cartesian"

export const CHART_TYPES: ChartType[] = ["area", "line", "bar", "pie", "radar"]
export const EASING_NAMES: EasingName[] = ["linear", "ease-out", "ease-in-out"]
export const VARIANTS: AreaVariant[] = ["gradient", "dotted", "hatched", "solid"]
export const BLOOMS: BloomLevel[] = ["off", "low", "high", "aura"]
export const STACKS: StackType[] = ["default", "stacked", "percent"]
export const DIRECTIONS: GradientDirection[] = ["up", "down", "left", "right"]
export const COLORS: DitherColor[] = [
  "green",
  "blue",
  "purple",
  "pink",
  "orange",
  "red",
  "grey",
]
