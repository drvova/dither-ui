// The Solid kit's public API, growing family by family until it holds
// everything `../tailwind/index.ts` (the Vue kit) does; then it takes that
// file's place. Names match the Vue kit's export for export.

export * from "../engine/api"
export { default as DitherButton, type ButtonVariant, type DitherButtonProps } from "./DitherButton"
export { default as DitherAurora, type AuroraParams, type AuroraProps, paintAurora } from "./Aurora"
export { default as DitherHeatTrail, type HeatTrailProps, type TrailParams, paintTrail } from "./HeatTrail"
export {
  default as DitherPoster,
  type DitherPosterProps,
  paintPoster,
  type PosterLayout,
  posterLayout,
  type PosterParams,
  type PosterTile,
} from "./DitherPoster"
export { default as DitherScreen, type DitherScreenProps } from "./DitherScreen"
export { useDitherMatrix, useLabelMatrix, useScreen } from "./runtime/screen"
export { surfaceOf, type DitherSurface } from "./runtime/surface"
export { cn } from "../tailwind/lib"
