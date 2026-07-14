import type {
  AvatarMirror,
  ButtonVariant,
  GradientDirection,
  PixelBloomConfig,
  PixelBloomInput,
  PixelColor,
} from "@dither-kit"

export type { PixelBloomConfig, PixelBloomInput, PixelColor }

/** Fully granular avatar model — every engine prop, editable. */
export type AvatarModel = {
  kind: "avatar"
  name: string
  autoColor: boolean // derive the colour from the name
  color: PixelColor // used when autoColor is off (hex or preset)
  mirror: AvatarMirror
  grid: number // even cells per side (4–16)
  cellPx: number // backing px per cell
  density: number // additive density bias (-0.5–0.5)
  offTier: number // unlit-pixel alpha tier (0–1)
  bloom: PixelBloomInput
  animate: boolean
  animationDuration: number
}

export type ButtonModel = {
  kind: "button"
  label: string
  color: PixelColor
  variant: ButtonVariant
  cell: number
  bloom: PixelBloomInput
}

export type ImageModel = {
  kind: "image"
  src: string
  alt: string
  cell: number
  focusY: number // 0 top - 1 bottom crop focus
  fade: number // px of dithered edge dissolve
}

export type GradientModel = {
  kind: "gradient"
  from: PixelColor
  twoTone: boolean
  to: PixelColor
  direction: GradientDirection
  cell: number
  opacity: number
  bloom: PixelBloomInput
}

/** A registry-driven kit component (switch, tabs, progress, …) — the
 * inspector renders its controls from the ComponentEntry spec. */
export type ComponentModel = {
  kind: "component"
  is: string // kit export name, resolved through the registry
  props: Record<string, unknown>
  slotText: string | null
  model: unknown // live v-model value for the interactive preview
}

import type { ScreenModel } from "./screen"

export type WidgetModel =
  | AvatarModel
  | ButtonModel
  | GradientModel
  | ImageModel
  | ComponentModel
  | ScreenModel
export type WidgetKind = WidgetModel["kind"]
