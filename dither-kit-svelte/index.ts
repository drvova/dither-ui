// Public API for Dither Kit (Svelte 5). Mirrors the Vue kit's surface as the
// port lands in batches. Ported so far: the four canonical control/effect
// patterns plus the generative canvas-background family (WebGL-free canvas +
// Bayer, all driven by the shared `ditherBackground` action).

export { default as Aurora, type AuroraParams } from "./Aurora.svelte"

// Generative canvas backgrounds (self-sizing `relative h-full w-full` roots).
export { default as Noise, type NoiseParams } from "./Noise.svelte"
export { default as Dither, type DitherBgParams } from "./Dither.svelte"
export { default as Cubes, type CubesParams } from "./Cubes.svelte"
export { default as PixelSnow, type PixelSnowParams } from "./PixelSnow.svelte"
export { default as Plasma, type PlasmaParams } from "./Plasma.svelte"
export { default as Iridescence, type IridescenceParams } from "./Iridescence.svelte"
export { default as Prism, type PrismParams } from "./Prism.svelte"
export { default as ShapeGrid, type ShapeGridParams } from "./ShapeGrid.svelte"
export { default as MetallicPaint, type MetallicPaintParams } from "./MetallicPaint.svelte"
export { default as Grainient, type GrainientParams } from "./Grainient.svelte"
export { default as ColorBends, type ColorBendsParams } from "./ColorBends.svelte"
export { default as PlasmaWave, type PlasmaWaveParams } from "./PlasmaWave.svelte"
export { default as LiquidChrome, type LiquidChromeParams } from "./LiquidChrome.svelte"
export { default as PrismaticBurst, type PrismaticBurstParams } from "./PrismaticBurst.svelte"
export { default as LetterGlitch, type LetterGlitchParams } from "./LetterGlitch.svelte"
export { default as Orb, type OrbParams } from "./Orb.svelte"
export { default as LaserFlow, type LaserFlowParams } from "./LaserFlow.svelte"
export { default as Balatro, type BalatroParams } from "./Balatro.svelte"
export { default as PixelBlast, type PixelBlastParams } from "./PixelBlast.svelte"
export { default as GradientBlinds, type GradientBlindsParams } from "./GradientBlinds.svelte"
export { default as DarkVeil, type DarkVeilParams } from "./DarkVeil.svelte"
export { default as Hyperspeed, type HyperspeedParams } from "./Hyperspeed.svelte"
export { default as LightPillar, type LightPillarParams } from "./LightPillar.svelte"
export { default as SoftAurora, type SoftAuroraParams } from "./SoftAurora.svelte"
export { default as Lightning, type LightningParams } from "./Lightning.svelte"
export { default as Galaxy, type GalaxyParams } from "./Galaxy.svelte"
export { default as Lightfall, type LightfallParams } from "./Lightfall.svelte"
export { default as GridMotion, type GridMotionParams } from "./GridMotion.svelte"
export { default as FloatingLines, type FloatingLinesParams } from "./FloatingLines.svelte"
export { default as GridScan, type GridScanParams } from "./GridScan.svelte"
export { default as Beams, type BeamsParams } from "./Beams.svelte"
export { default as Strands, type StrandsParams } from "./Strands.svelte"
export { default as Silk, type SilkParams } from "./Silk.svelte"
export { default as RippleGrid, type RippleGridParams } from "./RippleGrid.svelte"
export { default as LightRays, type RaysParams } from "./LightRays.svelte"
export { default as LineWaves, type LineWavesParams } from "./LineWaves.svelte"
export { default as Threads, type ThreadsParams } from "./Threads.svelte"
export { default as SideRays } from "./SideRays.svelte"
export { default as Radar, type RadarParams } from "./Radar.svelte"
// Pointer-reactive backgrounds (track the cursor via <svelte:window>).
export { default as GridDistortion, type GridDistortionParams } from "./GridDistortion.svelte"
export { default as EvilEye, type EvilEyeParams } from "./EvilEye.svelte"
export { default as MetaBalls, type MetaBallsParams } from "./MetaBalls.svelte"
export { default as DotGrid, type DotGridParams } from "./DotGrid.svelte"
export { default as Particles, type ParticlesParams } from "./Particles.svelte"
export { default as LiquidEther, type LiquidEtherParams } from "./LiquidEther.svelte"
export { default as DotField, type DotFieldParams } from "./DotField.svelte"
export { default as Ballpit, type BallpitParams } from "./Ballpit.svelte"
export { default as ShapeBlur, type ShapeBlurParams } from "./ShapeBlur.svelte"
export { default as Waves, type WavesParams } from "./Waves.svelte"
export { default as Ribbons, type RibbonsParams } from "./Ribbons.svelte"
export { default as Ferrofluid, type FerrofluidParams, type FlowDirection } from "./Ferrofluid.svelte"
export { default as FaultyTerminal, type FaultyTerminalParams } from "./FaultyTerminal.svelte"
// Text & motion effects (DOM/CSS, reduced-motion aware; reveal via `inView`).
export { default as ShinyText } from "./ShinyText.svelte"
export { default as GradientText } from "./GradientText.svelte"
export { default as GlitchText } from "./GlitchText.svelte"
export { default as BlurText } from "./BlurText.svelte"
export { default as RotatingText } from "./RotatingText.svelte"
export { default as CountUp } from "./CountUp.svelte"
export { default as GradualBlur } from "./GradualBlur.svelte"
export { default as StarBorder } from "./StarBorder.svelte"
export { default as GlareHover } from "./GlareHover.svelte"
export { default as FadeContent } from "./FadeContent.svelte"
export { default as AnimatedContent } from "./AnimatedContent.svelte"
export { inView } from "./in-view"
export {
  default as DitherButton,
  type ButtonVariant,
  type DitherRenderMode,
  type PrecompiledDither,
} from "./DitherButton.svelte"
export { default as DitherField } from "./DitherField.svelte"
export { default as DitherInput } from "./DitherInput.svelte"

// Shared runtime + tokens (also portable on their own).
export { ditherBackground, type DitherBackgroundParams } from "./use-dither-background"
export { CONTROL, CONTROL_BUTTON, POPOVER, setField, useField, type FieldContext } from "./control"

// Engine primitives are framework-agnostic and copied verbatim from the Vue
// kit; import them from their deep paths (e.g. "dither-kit-svelte/palette") to
// avoid barrel name collisions. Only the className helper is surfaced here.
export { cn } from "./lib"
