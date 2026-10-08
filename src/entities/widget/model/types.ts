import type {
  AvatarMirror,
  ButtonVariant,
  GradientDirection,
  PixelBloomConfig,
  PixelBloomInput,
  PixelColor,
} from "@dither-kit"

export type { PixelBloomConfig, PixelBloomInput, PixelColor }

/** How the avatar's cells are produced. */
export type AvatarSource = "seed" | "draw" | "image"

/** Fully granular avatar model — every engine prop, editable. */
export type AvatarModel = {
  kind: "avatar"
  name: string
  source: AvatarSource
  /** Explicit cells for draw/image sources (null while seeded). */
  pattern: { on: (boolean | 0 | 1)[]; density: number[] } | null
  imageSrc: string // image source URL / data URI
  imageThreshold: number // 0–1 luminance cut
  imageInvert: boolean // flip for dark-background images
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

export type ReelTransitionKind = "cut" | "dissolve" | "wipe-right" | "wipe-left" | "wipe-down" | "wipe-up"
/** How a clip comes in over the previous one: an ordered-dither dissolve or
 * wipe (`seconds` long, `cell` px cells, an optional seeded matrix), or a cut. */
export type ReelTransition = { kind: ReelTransitionKind; seconds: number; cell: number; seed: number | null }
export type ReelClip = { id: string; seconds: number; transition: ReelTransition }
/** A reel plays other frames in order — clips by artboard id — and exports as one video. */
export type ReelModel = { kind: "reel"; clips: ReelClip[] }

export type WidgetModel =
  | AvatarModel
  | ButtonModel
  | GradientModel
  | ImageModel
  | ComponentModel
  | ScreenModel
  | ReelModel
export type WidgetKind = WidgetModel["kind"]
