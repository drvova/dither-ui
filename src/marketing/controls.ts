import { reactive } from "vue"
import type {
  AreaVariant,
  BloomLevel,
  DitherColor,
  GradientDirection,
  StackType,
} from "../components/dither-kit"

/** Single source of truth for the playground — the controls panel writes here,
 * the live preview and the generated code snippet both read it. */
export const controls = reactive({
  selected: "area",
  variant: "gradient" as AreaVariant,
  bloom: "low" as BloomLevel,
  stackType: "default" as StackType,
  color: "blue" as DitherColor,
  animate: true,
  interactive: true,
  direction: "up" as GradientDirection,
  twoTone: false,
  innerRadius: 0.55,
  avatarName: "Ada Lovelace",
  replayToken: 0,
})

export function replay() {
  controls.replayToken += 1
}

export const VARIANTS: AreaVariant[] = ["gradient", "dotted", "hatched", "solid"]
export const BLOOMS: BloomLevel[] = ["off", "low", "high", "aura"]
export const STACKS: StackType[] = ["default", "stacked", "percent"]
export const COLORS: DitherColor[] = [
  "green",
  "blue",
  "purple",
  "pink",
  "orange",
  "red",
  "grey",
]
export const DIRECTIONS: GradientDirection[] = ["up", "down", "left", "right"]
