// Public API for Dither Kit (Vue). Mirrors the React kit's surface.

export { default as Area } from "./Area.vue"
export { default as Line } from "./Line.vue"
export { AreaChart, LineChart } from "./area-chart"
export { default as Bar } from "./Bar.vue"
export { BarChart } from "./bar-chart"
export { default as Pie } from "./Pie.vue"
export { PieChart } from "./pie-chart"
export { default as Radar } from "./Radar.vue"
export { RadarChart } from "./radar-chart"
export { default as RadarFrame } from "./RadarFrame.vue"

export { default as Grid } from "./Grid.vue"
export { default as XAxis } from "./XAxis.vue"
export { default as YAxis } from "./YAxis.vue"
export { default as Dot } from "./Dot.vue"
export { default as ActiveDot } from "./ActiveDot.vue"
export { default as Legend } from "./Legend.vue"
export { default as Tooltip, type TooltipVariant } from "./Tooltip.vue"
export { default as Sparkline } from "./Sparkline.vue"

export { default as DitherAvatar, type AvatarMirror } from "./DitherAvatar.vue"
export { default as DitherButton, type ButtonVariant } from "./DitherButton.vue"
export {
  default as DitherGradient,
  type GradientDirection,
} from "./DitherGradient.vue"
export { default as DitherImage } from "./DitherImage.vue"
export {
  default as DitherAurora,
  type AuroraParams,
  paintAurora,
} from "./Aurora.vue"
export {
  default as DitherWaves,
  type WavesParams,
  paintWaves,
} from "./Waves.vue"
export { default as DitherSilk, type SilkParams, paintSilk } from "./Silk.vue"
export { default as DitherPlasma, type PlasmaParams, paintPlasma } from "./Plasma.vue"
export { default as DitherLineWaves, type LineWavesParams, paintLineWaves } from "./LineWaves.vue"
export { default as DitherThreads, type ThreadsParams, paintThreads } from "./Threads.vue"
export { default as DitherDotGrid, type DotGridParams, paintDotGrid } from "./DotGrid.vue"
export { default as DitherRippleGrid, type RippleGridParams, paintRippleGrid } from "./RippleGrid.vue"
export { default as DitherIridescence, type IridescenceParams, paintIridescence } from "./Iridescence.vue"
export { default as DitherPixelSnow, type PixelSnowParams, paintPixelSnow } from "./PixelSnow.vue"
export { default as DitherBeams, type BeamsParams, paintBeams } from "./Beams.vue"
export { default as DitherGridMotion, type GridMotionParams, paintGridMotion } from "./GridMotion.vue"
export { default as DitherGridScan, type GridScanParams, paintGridScan } from "./GridScan.vue"
export { default as DitherGridDistortion, type GridDistortionParams, paintGridDistortion } from "./GridDistortion.vue"
export { default as DitherLightRays, type RaysParams, paintRays } from "./LightRays.vue"
export { default as DitherSideRays } from "./SideRays.vue"
export { default as DitherLightPillar, type LightPillarParams, paintLightPillar } from "./LightPillar.vue"
export { default as DitherSoftAurora, type SoftAuroraParams, paintSoftAurora } from "./SoftAurora.vue"
export { default as DitherDotField, type DotFieldParams, paintDotField } from "./DotField.vue"
export { default as DitherColorBends, type ColorBendsParams, paintColorBends } from "./ColorBends.vue"
export { default as DitherGradientBlinds, type GradientBlindsParams, paintGradientBlinds } from "./GradientBlinds.vue"
export { default as DitherGrainient, type GrainientParams, paintGrainient } from "./Grainient.vue"
export { default as DitherDither, type DitherBgParams, paintDitherBg } from "./Dither.vue"
export { default as DitherFloatingLines, type FloatingLinesParams, paintFloatingLines } from "./FloatingLines.vue"
export { default as DitherPlasmaWave, type PlasmaWaveParams, paintPlasmaWave } from "./PlasmaWave.vue"
export { default as DitherRadar, type RadarParams, paintRadar } from "./Radar.vue"
export { default as DitherLetterGlitch, type LetterGlitchParams, paintLetterGlitch } from "./LetterGlitch.vue"
export { default as DitherShapeGrid, type ShapeGridParams, paintShapeGrid } from "./ShapeGrid.vue"
export { default as DitherLightning, type LightningParams, paintLightning } from "./Lightning.vue"
export { default as DitherDarkVeil, type DarkVeilParams, paintDarkVeil } from "./DarkVeil.vue"
export { default as DitherLiquidChrome, type LiquidChromeParams, paintLiquidChrome } from "./LiquidChrome.vue"
export { default as DitherOrb, type OrbParams, paintOrb } from "./Orb.vue"
export { default as DitherPrism, type PrismParams, paintPrism } from "./Prism.vue"
export { default as DitherGalaxy, type GalaxyParams, paintGalaxy } from "./Galaxy.vue"
export { default as DitherBalatro, type BalatroParams, paintBalatro } from "./Balatro.vue"
export { default as DitherBallpit, type BallpitParams, paintBallpit } from "./Ballpit.vue"
export { default as DitherEvilEye, type EvilEyeParams, paintEvilEye } from "./EvilEye.vue"
export { default as DitherHyperspeed, type HyperspeedParams, paintHyperspeed } from "./Hyperspeed.vue"
export { default as DitherLightfall, type LightfallParams, paintLightfall } from "./Lightfall.vue"
export { default as DitherLiquidEther, type LiquidEtherParams, paintLiquidEther } from "./LiquidEther.vue"
export { default as DitherParticles, type ParticlesParams, paintParticles } from "./Particles.vue"
export { default as DitherPixelBlast, type PixelBlastParams, paintPixelBlast } from "./PixelBlast.vue"
export { default as DitherPrismaticBurst, type PrismaticBurstParams, paintPrismaticBurst } from "./PrismaticBurst.vue"
export {
  default as DitherFaultyTerminal,
  type FaultyTerminalParams,
  paintFaultyTerminal,
} from "./FaultyTerminal.vue"
export {
  default as DitherFerrofluid,
  type FerrofluidParams,
  type FlowDirection,
  paintFerrofluid,
} from "./Ferrofluid.vue"
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
export type { RasterBuffer } from "./raster"

// Form controls
export { default as DitherSwitch } from "./DitherSwitch.vue"
export { default as DitherCheckbox } from "./DitherCheckbox.vue"
export { default as DitherSlider, type SliderVariant } from "./DitherSlider.vue"
export { default as DitherProgress } from "./DitherProgress.vue"

// Feedback
export { default as DitherBadge } from "./DitherBadge.vue"
export { default as DitherSkeleton } from "./DitherSkeleton.vue"
export { default as DitherSpinner } from "./DitherSpinner.vue"
export { default as DitherSeparator } from "./DitherSeparator.vue"

// Navigation & data
export { default as DitherBreadcrumb, type Crumb } from "./DitherBreadcrumb.vue"
export { default as DitherPagination, pageList } from "./DitherPagination.vue"
export { default as DitherRating } from "./DitherRating.vue"
export { default as DitherStepper, type Step } from "./DitherStepper.vue"
export { default as DitherTimeline, type TimelineItem } from "./DitherTimeline.vue"

// Structure
export { default as DitherTabs, type TabItem, type TabsVariant } from "./DitherTabs.vue"
export { default as DitherTabPanel } from "./DitherTabPanel.vue"
export { default as DitherCollapsible } from "./DitherCollapsible.vue"
export { default as DitherDialog } from "./DitherDialog.vue"
export { default as DitherKbd } from "./DitherKbd.vue"

// Overlays & menus
export { default as DitherPopover } from "./DitherPopover.vue"
export { default as DitherMenu } from "./DitherMenu.vue"
export { default as DitherContextMenu } from "./DitherContextMenu.vue"
export { default as DitherMenubar } from "./DitherMenubar.vue"
export { default as DitherTooltip } from "./DitherTooltip.vue"
export { default as DitherPreviewCard } from "./DitherPreviewCard.vue"

// Fields & forms
export { default as DitherInput } from "./DitherInput.vue"
export { default as DitherTextarea } from "./DitherTextarea.vue"
export { default as DitherField } from "./DitherField.vue"
export { default as DitherFieldset } from "./DitherFieldset.vue"
export { default as DitherForm } from "./DitherForm.vue"
export { default as DitherNumberField } from "./DitherNumberField.vue"
export { default as DitherOtpField } from "./DitherOtpField.vue"

// Selection
export { default as DitherSelect, type Option } from "./DitherSelect.vue"
export { default as DitherCombobox } from "./DitherCombobox.vue"
export { default as DitherAutocomplete } from "./DitherAutocomplete.vue"
export { default as DitherRadioGroup } from "./DitherRadioGroup.vue"
export { default as DitherCheckboxGroup } from "./DitherCheckboxGroup.vue"
export { default as DitherToggle } from "./DitherToggle.vue"
export { default as DitherToggleGroup } from "./DitherToggleGroup.vue"

// Surfaces & status
export { default as DitherAccordion } from "./DitherAccordion.vue"
export { default as DitherAlertDialog } from "./DitherAlertDialog.vue"
export { default as DitherDrawer, type DrawerSide } from "./DitherDrawer.vue"
export { default as DitherDrawerIndent } from "./DitherDrawerIndent.vue"
export { default as DitherSwipeArea } from "./DitherSwipeArea.vue"
export {
  default as DitherSidebar,
  type SidebarCollapse,
  type SidebarDensity,
  type SidebarVariant,
} from "./DitherSidebar.vue"
export { default as DitherSidebarItem } from "./DitherSidebarItem.vue"
export { default as DitherSidebarGroup } from "./DitherSidebarGroup.vue"
export { default as DitherSidebarSub } from "./DitherSidebarSub.vue"
export { project, rubberband } from "./gesture"
export { default as DitherToaster } from "./DitherToaster.vue"
export { toast } from "./toast"
export { default as DitherMeter } from "./DitherMeter.vue"
export { default as DitherScrollArea } from "./DitherScrollArea.vue"
export { default as DitherToolbar } from "./DitherToolbar.vue"
export { default as DitherNavMenu } from "./DitherNavMenu.vue"

export type { CartesianChartProps } from "./cartesian-root"
export type { PolarChartProps } from "./polar-root"
export type {
  AreaVariant,
  ChartConfig,
  ChartType,
  Margins,
  SeriesKind,
  StrokeVariant,
} from "./chart-context"
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
  cssColor,
  hexToHsv,
  hsvToHex,
  rgbToHex,
  seedFromColor,
  seedFromHue,
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

// Text animations
export { default as DitherGradientText } from "./GradientText.vue"
export { default as DitherShinyText } from "./ShinyText.vue"
export { default as DitherGlitchText } from "./GlitchText.vue"
export { default as DitherSplitText } from "./SplitText.vue"
export { default as DitherRotatingText } from "./RotatingText.vue"
export { default as DitherCountUp } from "./CountUp.vue"
