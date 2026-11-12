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
export { default as DitherBalatro, type BalatroParams, type BalatroProps, paintBalatro } from "./Balatro"
export { default as DitherBallpit, type BallpitParams, type BallpitProps, paintBallpit } from "./Ballpit"
export { default as DitherBeams, type BeamsParams, type BeamsProps, paintBeams } from "./Beams"
export { default as DitherCircuit, type CircuitParams, type CircuitProps, paintCircuit } from "./Circuit"
export { default as DitherColorBends, type ColorBendsParams, type ColorBendsProps, paintColorBends } from "./ColorBends"
export { default as DitherCubes, type CubesParams, type CubesProps, paintCubes } from "./Cubes"
export { default as DitherDarkVeil, type DarkVeilParams, type DarkVeilProps, paintDarkVeil } from "./DarkVeil"
export { default as DitherDotField, type DotFieldParams, type DotFieldProps, paintDotField } from "./DotField"
export { default as DitherDotGrid, type DotGridParams, type DotGridProps, paintDotGrid } from "./DotGrid"
export { default as DitherEvilEye, type EvilEyeParams, type EvilEyeProps, paintEvilEye } from "./EvilEye"
export {
  default as DitherFaultyTerminal,
  type FaultyTerminalParams,
  type FaultyTerminalProps,
  paintFaultyTerminal,
} from "./FaultyTerminal"
export { default as DitherDither, type DitherBgParams, type DitherProps, paintDitherBg } from "./Dither"
export {
  default as DitherFerrofluid,
  type FerrofluidParams,
  type FerrofluidProps,
  type FlowDirection,
  paintFerrofluid,
} from "./Ferrofluid"
export {
  default as DitherShader,
  type DitherShaderApi,
  type DitherShaderProps,
  ditherShaderPixels,
  sampleShader,
  wrapShader,
  type ShaderChannel,
  type ShaderDither,
  type ShaderProgram,
} from "./DitherShader"
export {
  default as DitherWorld,
  type DitherWorldApi,
  type DitherWorldProps,
  createWorldGpu,
  createWorldMaterial,
  externalResources,
  formatOf,
  packTarget,
  packUv,
  paintMaterial,
  paintTarget,
  paintWorld,
  parseWorld,
  rasterizeWorld,
  sampleWorld,
  type ModelFormat,
  type World,
  type WorldGpu,
  type WorldMaterial,
  type WorldMesh,
  type WorldStyle,
  type WorldTarget,
  type WorldView,
} from "./DitherWorld"
export { default as DitherAsciiText, type AsciiTextProps } from "./AsciiText"
export { default as DitherBlockquote, type BlockquoteProps } from "./Blockquote"
export { default as DitherCascadeSelect, type CascadeSelectProps } from "./CascadeSelect"
export { default as DitherCenterMorphModal, type CenterMorphModalProps } from "./CenterMorphModal"
export { default as DitherAvatar, type DitherAvatarProps, type AvatarMirror } from "./DitherAvatar"
export { default as DitherBadge, type DitherBadgeProps } from "./DitherBadge"
export { default as DitherImage, type DitherImageProps } from "./DitherImage"
export { default as DitherKbd, type DitherKbdProps } from "./DitherKbd"
export { default as DitherNavMenu, type DitherNavMenuProps } from "./DitherNavMenu"
export { default as DitherSeparator, type DitherSeparatorProps } from "./DitherSeparator"
export { default as DitherStepper, type DitherStepperProps, type Step } from "./DitherStepper"
export { default as DitherTabs, type DitherTabsProps, type TabItem, type TabsVariant } from "./DitherTabs"
export { default as DitherTabPanel, type DitherTabPanelProps } from "./DitherTabPanel"
export { default as DitherToolbar, type DitherToolbarProps } from "./DitherToolbar"
export { default as DitherGlareHover, type GlareHoverProps } from "./GlareHover"
export { default as DitherGlitchText, type GlitchTextProps } from "./GlitchText"
export { default as DitherKbdCombo, type KbdComboProps } from "./KbdCombo"
export { default as DitherMagnetLines, type MagnetLinesProps } from "./MagnetLines"
export { default as DitherNumberText, type NumberTextProps } from "./NumberText"
export { default as DitherPercentText, type PercentTextProps } from "./PercentText"
export { default as DitherPreviewRail, type PreviewRailProps, type PreviewRailItem } from "./PreviewRail"
export { default as DitherRelativeTime, type RelativeTimeProps } from "./RelativeTime"
export { default as DitherScrollReveal, type ScrollRevealProps } from "./ScrollReveal"
export { default as DitherSelectableText, type SelectableTextProps } from "./SelectableText"
export { default as DitherShinyText, type ShinyTextProps } from "./ShinyText"
export { default as DitherTextType, type TextTypeProps } from "./TextType"
export { default as DitherCardStack, type CardStackProps } from "./CardStack"
export { default as DitherCheckbox, type DitherCheckboxProps } from "./DitherCheckbox"
export { default as DitherCheckboxCard, type CheckboxCardProps } from "./CheckboxCard"
export { default as DitherCircularText, type CircularTextProps } from "./CircularText"
export { default as DitherClickSpark, type ClickSparkProps } from "./ClickSpark"
export { default as DitherColorSwatch, type ColorSwatchProps } from "./ColorSwatch"
export { default as DitherCurrencyText, type CurrencyTextProps } from "./CurrencyText"
export { default as DitherCurvedLoop, type CurvedLoopProps } from "./CurvedLoop"
export { default as DitherSelect, type DitherSelectProps, type Option } from "./DitherSelect"
export { default as DitherCheckboxGroup, type DitherCheckboxGroupProps } from "./DitherCheckboxGroup"
export { default as DitherCombobox, type DitherComboboxProps } from "./DitherCombobox"
export { default as DitherFieldset, type DitherFieldsetProps } from "./DitherFieldset"
export { default as DitherNumberField, type DitherNumberFieldProps } from "./DitherNumberField"
export { default as DitherPreviewCard, type DitherPreviewCardProps } from "./DitherPreviewCard"
export { default as DitherRadioGroup, type DitherRadioGroupProps } from "./DitherRadioGroup"
export { default as DitherToggle, type DitherToggleProps } from "./DitherToggle"
export { default as DitherToggleGroup, type DitherToggleGroupProps } from "./DitherToggleGroup"
export { default as DitherDock, type DockProps, type DockItem } from "./Dock"
export { default as DitherElectricBorder, type ElectricBorderProps } from "./ElectricBorder"
export { default as DitherEmoji, type EmojiProps } from "./Emoji"
export { default as DitherImg, type ImageProps } from "./Image"
export { default as DitherKnob, type KnobProps } from "./Knob"
export { default as DitherMagicRings, type MagicRingsProps } from "./MagicRings"
export { default as DitherScrollVelocity, type ScrollVelocityProps } from "./ScrollVelocity"
export { default as DitherTransferList, type TransferListProps } from "./TransferList"
export { default as DitherTrueFocus, type TrueFocusProps } from "./TrueFocus"
export { default as DitherAntigravity, type AntigravityProps } from "./Antigravity"
export { default as DitherAlertDialog, type DitherAlertDialogProps } from "./DitherAlertDialog"
export { default as DitherCollapsible, type DitherCollapsibleProps } from "./DitherCollapsible"
export { default as DitherCommand, type DitherCommandProps, type CommandItem } from "./DitherCommand"
export { default as DitherDialog, type DitherDialogProps } from "./DitherDialog"
export { default as DitherGauge, type DitherGaugeProps } from "./DitherGauge"
export { default as DitherMeter, type DitherMeterProps } from "./DitherMeter"
export { default as DitherSchedule, type DitherScheduleProps, type ScheduleEvent } from "./DitherSchedule"
export { default as DitherExpandTabs, type ExpandTabsProps, type ExpandTab } from "./ExpandTabs"
export { default as DitherGradientText, type GradientTextProps } from "./GradientText"
export { default as DitherInputGroup, type InputGroupProps } from "./InputGroup"
export { default as DitherLogoLoop, type LogoLoopProps } from "./LogoLoop"
export { default as DitherMagnet, type MagnetProps } from "./Magnet"
export { default as DitherMentionInput, type MentionInputProps } from "./MentionInput"
export { default as DitherNumberFlow, type NumberFlowProps } from "./NumberFlow"
export { default as DitherOverline, type OverlineProps } from "./Overline"
export { default as DitherPluralText, type PluralTextProps } from "./PluralText"
export { default as DitherRotatingText, type RotatingTextProps } from "./RotatingText"
export { default as DitherStarBorder, type StarBorderProps } from "./StarBorder"
export { default as DitherThumbnail, type ThumbnailProps } from "./Thumbnail"
export { default as DitherVisuallyHidden, type VisuallyHiddenProps } from "./VisuallyHidden"
export { default as DitherWalletCard, type WalletCardProps, type WalletAccount, type WalletAction } from "./WalletCard"
export { default as DitherBouncyAccordion, type BouncyAccordionProps, type BouncyItem } from "./BouncyAccordion"
export { default as DitherBox, type BoxProps } from "./Box"
export { default as DitherChoiceChips, type ChoiceChipsProps } from "./ChoiceChips"
export { default as DitherTextarea, type DitherTextareaProps } from "./DitherTextarea"
export { default as DitherCodeInput, type CodeInputProps } from "./CodeInput"
export { default as DitherDateTimeText, type DateTimeTextProps } from "./DateTimeText"
export { default as DitherAccordion, type DitherAccordionProps } from "./DitherAccordion"
export { default as DitherAutocomplete, type DitherAutocompleteProps } from "./DitherAutocomplete"
export { default as DitherCanvas, type DitherCanvasProps } from "./DitherCanvas"
export { default as DitherContainer, type DitherContainerProps } from "./DitherContainer"
export { default as DitherFocusScope, type FocusScopeProps } from "./FocusScope"
export { default as DitherDrawer, type DitherDrawerProps, type DrawerSide } from "./DitherDrawer"
export { default as DitherDrawerIndent, type DitherDrawerIndentProps } from "./DitherDrawerIndent"
export { default as DitherOtpField, type DitherOtpFieldProps } from "./DitherOtpField"
export { default as DitherSpinner, type DitherSpinnerProps } from "./DitherSpinner"
export { default as DitherFallingText, type FallingTextProps } from "./FallingText"
export { default as DitherIsland, type IslandProps } from "./Island"
export { default as DitherLabel, type LabelProps } from "./Label"
export { default as DitherLineClamp, type LineClampProps } from "./LineClamp"
export { default as DitherOverlay, type OverlayProps } from "./Overlay"
export { default as DitherPixelTrail, type PixelTrailProps } from "./PixelTrail"
export { default as DitherPressable, type PressableProps, type PressableVariant } from "./Pressable"
export { default as DitherShuffle, type ShuffleProps } from "./Shuffle"
export { default as DitherVariableProximity, type VariableProximityProps } from "./VariableProximity"
export { default as DitherWheelPicker, type WheelPickerProps, type WheelOption } from "./WheelPicker"
export { default as DitherAnimatedContent, type AnimatedContentProps } from "./AnimatedContent"
export { default as DitherCaption, type CaptionProps } from "./Caption"
export { default as DitherDecryptedText, type DecryptedTextProps } from "./DecryptedText"
export { default as DitherForm, type DitherFormProps } from "./DitherForm"
export { default as DitherGradient, type DitherGradientProps, type GradientDirection } from "./DitherGradient"
export {
  default as DitherSidebar,
  type DitherSidebarProps,
  type SidebarCollapse,
  type SidebarDensity,
  type SidebarVariant,
} from "./DitherSidebar"
export { default as DitherRail, type DitherRailProps } from "./DitherRail"
export { default as DitherScope, type DitherScopeProps } from "./DitherScope"
export { default as DitherSidebarGroup, type DitherSidebarGroupProps } from "./DitherSidebarGroup"
export { default as DitherSidebarItem, type DitherSidebarItemProps } from "./DitherSidebarItem"
export { default as DitherSidebarSub, type DitherSidebarSubProps } from "./DitherSidebarSub"
export { default as DitherSkeleton, type DitherSkeletonProps } from "./DitherSkeleton"
export { default as DitherSwipeArea, type DitherSwipeAreaProps } from "./DitherSwipeArea"
export { default as DitherDivider, type DividerProps } from "./Divider"
export { default as DitherFontPicker, type FontPickerProps } from "./FontPicker"
export { default as DitherGradualBlur, type GradualBlurProps } from "./GradualBlur"
export { default as DitherImageTrail, type ImageTrailProps } from "./ImageTrail"
export { default as DitherListBox, type ListBoxProps } from "./ListBox"
export { default as DitherMonthPicker, type MonthPickerProps } from "./MonthPicker"
export {
  default as DitherNotificationStack,
  type NotificationStackProps,
  type NotificationItem,
  type NotificationStackVariant,
} from "./NotificationStack"
export { default as DitherOrbitImages, type OrbitImagesProps } from "./OrbitImages"
export { default as DitherSlideAction, type SlideActionProps } from "./SlideAction"
export { default as DitherSpacer, type SpacerProps } from "./Spacer"
export { default as DitherStickerPeel, type StickerPeelProps } from "./StickerPeel"
export { default as DitherSvg, type SvgProps } from "./Svg"
export { default as DitherTextCursor, type TextCursorProps } from "./TextCursor"
export { default as DitherTextPressure, type TextPressureProps } from "./TextPressure"
export { default as DitherBlurText, type BlurTextProps } from "./BlurText"
export { default as DitherCode, type CodeProps } from "./Code"
export { default as DitherCountUp, type CountUpProps } from "./CountUp"
export { default as DitherBreadcrumb, type DitherBreadcrumbProps, type Crumb } from "./DitherBreadcrumb"
export { default as DitherContextMenu, type DitherContextMenuProps } from "./DitherContextMenu"
export { default as DitherGrid, type DitherGridProps } from "./DitherGrid"
export { default as DitherInfiniteCanvas, type DitherInfiniteCanvasProps } from "./DitherInfiniteCanvas"
export { default as DitherMenu, type DitherMenuProps } from "./DitherMenu"
export { default as DitherPagination, type DitherPaginationProps, pageList } from "./DitherPagination"
export { default as DitherRating, type DitherRatingProps } from "./DitherRating"
export { default as DitherSlider, type DitherSliderProps, type SliderVariant } from "./DitherSlider"
export { default as DitherTimeline, type DitherTimelineProps, type TimelineItem } from "./DitherTimeline"
export { default as DitherVideoPlayer, type DitherVideoPlayerProps } from "./DitherVideoPlayer"
export { default as DitherDurationText, type DurationTextProps } from "./DurationText"
export { default as DitherEllipsisTooltip, type EllipsisTooltipProps } from "./EllipsisTooltip"
export { default as DitherGooeyMenu, type GooeyMenuProps, type GooeyItem } from "./GooeyMenu"
export { default as DitherHeading, type HeadingProps } from "./Heading"
export { default as DitherInView, type InViewProps } from "./InView"
export { default as DitherPixelTransition, type PixelTransitionProps } from "./PixelTransition"
export { default as DitherScrollFloat, type ScrollFloatProps } from "./ScrollFloat"
export { default as DitherSequence, type SequenceProps } from "./Sequence"
export { default as DitherSnapButton, type SnapButtonProps } from "./SnapButton"
export { default as DitherTruncate, type TruncateProps } from "./Truncate"
