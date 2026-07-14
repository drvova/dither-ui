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
export { default as DitherField } from "./DitherField.vue"
export { default as DitherFieldset } from "./DitherFieldset.vue"
export { default as DitherForm } from "./DitherForm.vue"
export { default as DitherNumberField } from "./DitherNumberField.vue"
export { default as DitherOtpField } from "./DitherOtpField.vue"

// Selection
export { default as DitherSelect } from "./DitherSelect.vue"
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
  TextureConfig,
  VariantInput,
} from "./dither-paint"
export {
  bloomFromSeed,
  easingFromSeed,
  geometryFromSeed,
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
