// The engine's public API: every framework-free name the kit hands a
// consumer. A layer's `index.ts` (`solid/`, and its generated StyleX twin,
// the `@dither-ui/kit-stylex` package) re-exports this whole file and adds its
// own components, so neither lists the engine twice.

export type { DitherRenderMode, PrecompiledDither } from "./precompile"
export {
  precompiledSrc,
  renderDitherButton,
  renderDitherGradient,
  DEFAULT_MAX_COLS,
  DEFAULT_MAX_ROWS,
  STATIC_DEFAULT_MAX_COLS,
  STATIC_DEFAULT_MAX_ROWS,
} from "./precompile"
export type { ButtonRasterOptions, GradientRasterOptions } from "./precompile"
export { createRasterBuffer, putRasterBuffer, setRasterPixel32, setOrBlendRasterPixel } from "./raster"
export { SCREENS, SCREEN_KINDS, screenMatrix, type ScreenKind } from "./pixel"
export type { RasterBuffer } from "./raster"
export {
  compileTrack,
  keyframeTransform,
  LENGTH_UNITS,
  lerpTerms,
  parseAngle,
  parseLength,
  resolveSample,
  sampleKeyframes,
  termsToCss,
  termsToPx,
  type CompiledTrack,
  type CqBox,
  type KeyEasing,
  type Keyframe,
  type KeyframeSample,
  type KeyframeTrack,
  type Length,
  type LengthEnv,
  type LengthUnit,
  type Terms,
} from "./keyframes"
export { project, rubberband } from "./gesture"
export { inView } from "./place"
export type {
  BloomBlend,
  BloomConfig,
  BloomInput,
  BloomLevel,
  BezierPoints,
  EasingInput,
  EasingName,
  EdgeEffectParams,
  Glyph,
  TextureConfig,
  VariantInput,
} from "./dither-paint"
export {
  bloomFromSeed,
  easingFromSeed,
  effectFromSeed,
  geometryFromSeed,
  glyphFromSeed,
  kitFromSeed,
  matrixFromSeed,
  motionFromSeed,
  mulberry32,
  resolveMatrix,
  resolveTexture,
  revealFromSeed,
  sparklesFromSeed,
  textureFromSeed,
} from "./dither-paint"
export { cubicBezier, EASINGS, resolveEasing } from "./dither-paint"
export type { DotVariant } from "./dot-paint"
export type { DitherColor } from "./palette"
export {
  colorToHex,
  contrast,
  cssColor,
  hexToHsv,
  hsvToHex,
  luminance,
  rgbToHex,
  seedFromColor,
  seedFromHue,
  toGamma,
  toLinear,
} from "./palette"
export type { PixelBloom, PixelBloomConfig, PixelBloomInput, PixelColor } from "./pixel"
export type { StackType } from "./scales"
export {
  type AvatarPattern,
  clampGrid,
  normalizePattern,
  patternFromImage,
  patternFromPixels,
  seededPattern,
} from "./avatar-pattern"
export { wrapMaterial } from "./shader"
export { copyText } from "./copy-text"
export { isTab } from "./keys"
export {
  applyTheme,
  THEME_TOKENS,
  themeCss,
  themeVars,
  type ThemeInput,
  type ThemeToken,
  type ThemeVars,
} from "./theme"
export { bindChannel, createChannels, rasterOf, type ChannelInput, type Channels } from "./gl"
export {
  ditherTransition,
  ditherViewTransition,
  type DitherTransitionOptions,
  type ViewTransitionLike,
} from "./transition"
export { scoreCut, wavBytes, type ScoreAudio, type ScorePlan } from "./score"
export { ICONS, ICON_NAMES, type IconName } from "./icons"
export { linear, steps, frameSteps, frameIndex, cssSteps } from "./timing"
export { directFromHyperframes, directedTime, isDirected, onSeek, release, seek } from "./clock"
export type { SeekListener } from "./clock"
export { planSequence, sampleSequence, staggerDelay } from "./sequence"
export { CONTAINER_SCALE, resolveCq, quantize } from "./containers"
export type {
  SequenceNode,
  SequencePlan,
  ScheduledTrack,
  TrackNode,
  SerialNode,
  ParallelNode,
  StaggerNode,
  StaggerFrom,
  TrackSample,
  TrackState,
} from "./sequence"
export type { Easing, StepPosition } from "./timing"
export type { CqRange, CqScale, CqState } from "./containers"
