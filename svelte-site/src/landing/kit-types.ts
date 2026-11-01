// What the landing's copies of Vue landing modules read from `@dither-kit`
// (types only, so the bundler never resolves it): the same names, from the
// Svelte kit's engine, which is the Vue kit's verbatim copy. tsconfig maps
// `@dither-kit` here.
export type { PixelColor, ScreenKind } from "@dither-kit/engine/pixel"
