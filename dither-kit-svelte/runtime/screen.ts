// The print screen a subtree dithers through: the Vue kit's
// `engine/use-screen.ts` on Svelte's context. `DitherScreen` sets it, and
// every pixel surface and chart canvas reads its threshold matrix through
// `useDitherMatrix` / `useVariantMatrix`, called during component init.
// Without a `DitherScreen` it is the Bayer matrix, exactly as before.

import { getContext, setContext } from "svelte"
import { resolveMatrix, type DitherMatrix, type VariantInput } from "../engine/dither-paint"
import { screenMatrix, type ScreenKind } from "../engine/pixel"

const SCREEN = Symbol("dither-screen")
type ScreenGetter = () => ScreenKind

export function setScreen(screen: ScreenGetter): void {
  setContext(SCREEN, screen)
}

const screenHere = () => getContext<ScreenGetter | undefined>(SCREEN)

/** The screen in effect (call during init): the nearest `DitherScreen`'s,
 * else none. For a surface that thresholds through the raster builders. */
export function useScreen(): () => ScreenKind | undefined {
  const screen = screenHere()
  return () => screen?.()
}

/** The threshold matrix for a surface's seed: the screen in effect, seeded
 * by the surface's seed when it has one. */
export function useDitherMatrix(): (seed: number | undefined) => number[][] {
  const screen = screenHere()
  return (seed) => screenMatrix(screen?.() ?? "bayer", seed)
}

/** A fill that carries a label (button, badge, toggle) keeps the Bayer
 * matrix under any screen: its label's ink is chosen for that even spread,
 * which a coarse screen breaks into stripes or dots under the letters. */
export function useLabelMatrix(): (seed: number | undefined) => number[][] {
  return (seed) => screenMatrix("bayer", seed)
}

/** A chart's: a series' matrix from its variant. Under a screen, the screen
 * seeded by a numeric variant; else the variant's own (`resolveMatrix`). */
export function useVariantMatrix(): (variant: VariantInput) => DitherMatrix {
  const screen = screenHere()
  return (variant) =>
    screen ? screenMatrix(screen(), typeof variant === "number" ? variant : undefined) : resolveMatrix(variant)
}
