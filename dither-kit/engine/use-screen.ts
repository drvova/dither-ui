// The print screen a subtree dithers through. `DitherScreen` provides it,
// and every pixel surface reads its threshold matrix through
// `useDitherMatrix`, which seeds the screen with the surface's own seed: one
// wrapper prints everything inside it as lines, hatching, dots or a cross.
// Without a wrapper it is the Bayer matrix, exactly as before.

import { computed, inject, type ComputedRef, type InjectionKey, type Ref } from "vue"
import { resolveMatrix, type DitherMatrix, type VariantInput } from "./dither-paint"
import { screenMatrix, type ScreenKind } from "./pixel"

export const SCREEN: InjectionKey<Readonly<Ref<ScreenKind>>> = Symbol("dither-screen")

/** The screen in effect where this is called: the nearest `DitherScreen`'s,
 * else none (the Bayer matrix). */
export function useScreen(): Readonly<Ref<ScreenKind>> | null {
  return inject(SCREEN, null)
}

/** The threshold matrix a surface dithers with: the screen in effect,
 * seeded by the surface's seed when it has one. */
export function useDitherMatrix(seed: () => number | undefined): ComputedRef<number[][]> {
  const screen = useScreen()
  return computed(() => screenMatrix(screen?.value ?? "bayer", seed()))
}

/** A fill that carries a label (button, badge, toggle) keeps the Bayer
 * matrix under any screen: its label's ink is chosen for that even spread
 * (`darkInkOnDark` at the variant's coverage), which a coarse screen breaks
 * into stripes or dots under the letters. Seeded as ever. */
export function useLabelMatrix(seed: () => number | undefined): ComputedRef<number[][]> {
  return computed(() => screenMatrix("bayer", seed()))
}

/** A chart's: a series' matrix from its variant. Under a screen, the screen
 * seeded by a numeric variant; else the variant's own (`resolveMatrix`). */
export function useVariantMatrix(): (variant: VariantInput) => DitherMatrix {
  const screen = useScreen()
  return (variant) =>
    screen ? screenMatrix(screen.value, typeof variant === "number" ? variant : undefined) : resolveMatrix(variant)
}
