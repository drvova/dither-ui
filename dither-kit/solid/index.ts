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
export {
  default as DitherFloatingLines,
  type FloatingLinesProps,
  paintFloatingLines,
  type FloatingLinesParams,
} from "./FloatingLines"
export {
  default as DitherFlowField,
  type FlowFieldProps,
  paintFlowField,
  fadeRasterAlpha,
  type FlowFieldParams,
} from "./FlowField"
export { default as DitherGalaxy, type GalaxyProps, paintGalaxy, type GalaxyParams } from "./Galaxy"
export {
  default as DitherGradientBlinds,
  type GradientBlindsProps,
  paintGradientBlinds,
  type GradientBlindsParams,
} from "./GradientBlinds"
export { default as DitherGrainient, type GrainientProps, paintGrainient, type GrainientParams } from "./Grainient"
export {
  default as DitherGridDistortion,
  type GridDistortionProps,
  paintGridDistortion,
  type GridDistortionParams,
} from "./GridDistortion"
export { default as DitherGridMotion, type GridMotionProps, paintGridMotion, type GridMotionParams } from "./GridMotion"
export { default as DitherGridScan, type GridScanProps, paintGridScan, type GridScanParams } from "./GridScan"
export { default as DitherHyperspeed, type HyperspeedProps, paintHyperspeed, type HyperspeedParams } from "./Hyperspeed"
export {
  default as DitherIridescence,
  type IridescenceProps,
  paintIridescence,
  type IridescenceParams,
} from "./Iridescence"
export { default as DitherLaserFlow, type LaserFlowProps, paintLaserFlow, type LaserFlowParams } from "./LaserFlow"
export {
  default as DitherLetterGlitch,
  type LetterGlitchProps,
  paintLetterGlitch,
  type LetterGlitchParams,
} from "./LetterGlitch"
export {
  default as DitherLightPillar,
  type LightPillarProps,
  paintLightPillar,
  type LightPillarParams,
} from "./LightPillar"
export { default as DitherLightRays, type RaysParams, type LightRaysProps, paintRays } from "./LightRays"
export { default as DitherLightfall, type LightfallParams, type LightfallProps, paintLightfall } from "./Lightfall"
export { default as DitherLightning, type LightningParams, type LightningProps, paintLightning } from "./Lightning"
export { default as DitherLineWaves, type LineWavesParams, type LineWavesProps, paintLineWaves } from "./LineWaves"
export {
  default as DitherLiquidChrome,
  type LiquidChromeParams,
  type LiquidChromeProps,
  paintLiquidChrome,
} from "./LiquidChrome"
export {
  default as DitherLiquidEther,
  type LiquidEtherParams,
  type LiquidEtherProps,
  paintLiquidEther,
} from "./LiquidEther"
export { default as DitherMetaBalls, type MetaBallsParams, type MetaBallsProps, paintMetaBalls } from "./MetaBalls"
export {
  default as DitherMetallicPaint,
  type MetallicPaintParams,
  type MetallicPaintProps,
  paintMetallicPaint,
} from "./MetallicPaint"
export { default as DitherNoise, type NoiseParams, type NoiseProps, paintNoiseField } from "./Noise"
export { default as DitherOrb, type OrbParams, type OrbProps, paintOrb } from "./Orb"
export { default as DitherParticles, type ParticlesParams, type ParticlesProps, paintParticles } from "./Particles"
export { default as DitherPixelBlast, type PixelBlastParams, type PixelBlastProps, paintPixelBlast } from "./PixelBlast"
export { default as DitherPixelSnow, type PixelSnowParams, type PixelSnowProps, paintPixelSnow } from "./PixelSnow"
export { default as DitherPlasma, type PlasmaProps, type PlasmaParams, paintPlasma } from "./Plasma"
export { default as DitherPlasmaWave, type PlasmaWaveProps, type PlasmaWaveParams, paintPlasmaWave } from "./PlasmaWave"
export { default as DitherPrism, type PrismProps, type PrismParams, paintPrism } from "./Prism"
export {
  default as DitherPrismaticBurst,
  type PrismaticBurstProps,
  type PrismaticBurstParams,
  paintPrismaticBurst,
} from "./PrismaticBurst"
export { default as DitherRadar, type RadarSweepProps, type RadarParams, paintRadar } from "./RadarSweep"
export { default as DitherRibbons, type RibbonsProps, type RibbonsParams, paintRibbons } from "./Ribbons"
export { default as DitherRippleGrid, type RippleGridProps, type RippleGridParams, paintRippleGrid } from "./RippleGrid"
export { default as DitherShapeBlur, type ShapeBlurProps, type ShapeBlurParams, paintShapeBlur } from "./ShapeBlur"
export { default as DitherShapeGrid, type ShapeGridProps, type ShapeGridParams, paintShapeGrid } from "./ShapeGrid"
export { default as DitherSideRays, type SideRaysProps } from "./SideRays"
export { default as DitherSilk, type SilkProps, type SilkParams, paintSilk } from "./Silk"
export { default as DitherSoftAurora, type SoftAuroraProps, type SoftAuroraParams, paintSoftAurora } from "./SoftAurora"
export { default as DitherStrands, type StrandsProps, type StrandsParams, paintStrands } from "./Strands"
export { default as DitherThreads, type ThreadsProps, type ThreadsParams, paintThreads } from "./Threads"
export { default as DitherWaves, type WavesProps, type WavesParams, paintWaves } from "./Waves"
