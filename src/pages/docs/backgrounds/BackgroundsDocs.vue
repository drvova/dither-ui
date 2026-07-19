<script setup lang="ts">
import { computed, reactive } from "vue"
import {
  cssColor,
  DitherAurora,
  DitherBeams,
  DitherColorBends,
  DitherDarkVeil,
  DitherGalaxy,
  DitherLetterGlitch,
  DitherLightning,
  DitherLiquidChrome,
  DitherOrb,
  DitherPrism,
  DitherShapeGrid,
  DitherDither,
  DitherDotField,
  DitherDotGrid,
  DitherFloatingLines,
  DitherGradientBlinds,
  DitherGrainient,
  DitherPlasmaWave,
  DitherRadar,
  DitherGridDistortion,
  DitherGridMotion,
  DitherGridScan,
  DitherLightPillar,
  DitherLightRays,
  DitherSideRays,
  DitherSoftAurora,
  DitherFaultyTerminal,
  DitherFerrofluid,
  DitherIridescence,
  DitherLineWaves,
  DitherPixelSnow,
  DitherPlasma,
  DitherRippleGrid,
  DitherSilk,
  DitherThreads,
  DitherWaves,
  type DitherColor,
  type FlowDirection,
} from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

const COLORS: DitherColor[] = ["green", "blue", "purple", "pink", "orange", "red", "grey"]
const chipClass = (active: boolean) =>
  `rounded px-2.5 py-1 text-[11px] transition-colors ${active ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`

// Aurora playground — a colour ramp preset; the code tab mirrors it.
const AURORA_PALETTES = {
  polar: ["#5227FF", "#7CFF67", "#5227FF"],
  emerald: ["#27FF64", "#7CFF67", "#A8FFB6"],
  sunset: ["#FF3D2E", "#FF8A3D", "#FFD23D"],
} as const
type AuroraPalette = keyof typeof AURORA_PALETTES
const AURORA_PALETTE_NAMES = Object.keys(AURORA_PALETTES) as AuroraPalette[]
const aurora = reactive({ palette: "polar" as AuroraPalette })
const auroraColors = computed(() => [...AURORA_PALETTES[aurora.palette]])
const auroraCode = computed(
  () => `<div class="relative h-64 overflow-hidden rounded-md">\n  <DitherAurora :colors='${JSON.stringify(auroraColors.value)}' />\n</div>`
)

// Waves playground — a colour ramp preset; the code tab mirrors it.
const WAVES_PALETTES = {
  aurora: ["#5227FF", "#7CFF67"],
  ocean: ["#3DA5FF", "#7CE0FF"],
  sunset: ["#FF3D2E", "#FFD23D"],
} as const
type WavesPalette = keyof typeof WAVES_PALETTES
const WAVES_PALETTE_NAMES = Object.keys(WAVES_PALETTES) as WavesPalette[]
const waves = reactive({ palette: "aurora" as WavesPalette })
const wavesColors = computed(() => [...WAVES_PALETTES[waves.palette]])
const wavesCode = computed(
  () => `<div class="relative h-64 overflow-hidden rounded-md">\n  <DitherWaves :colors='${JSON.stringify(wavesColors.value)}' />\n</div>`
)

// Faulty-terminal playground — a tint swatch plus feel presets that swap the
// effect knobs; the code tab mirrors exactly what the preview renders.
const TERM_PRESETS = {
  signal: { scale: 1.5, glitchAmount: 0.6, scanlineIntensity: 0.8, dither: 0, curvature: 0, chromaticAberration: 0 },
  glitch: { scale: 1.4, glitchAmount: 2.2, scanlineIntensity: 1.2, dither: 0, curvature: 0.05, chromaticAberration: 3 },
  dithered: { scale: 1.8, glitchAmount: 0.4, scanlineIntensity: 0.6, dither: 1, curvature: 0, chromaticAberration: 0 },
  crt: { scale: 1.6, glitchAmount: 0.8, scanlineIntensity: 1.4, dither: 0.3, curvature: 0.35, chromaticAberration: 2 },
} as const
type TermPreset = keyof typeof TERM_PRESETS
const TERM_PRESET_NAMES = Object.keys(TERM_PRESETS) as TermPreset[]
const term = reactive({ tint: "green" as DitherColor, preset: "signal" as TermPreset })
const termParams = computed(() => TERM_PRESETS[term.preset])
const termCode = computed(() => {
  const p = termParams.value
  const attrs = [`tint="${term.tint}"`, `:scale="${p.scale}"`, `:glitch-amount="${p.glitchAmount}"`, `:scanline-intensity="${p.scanlineIntensity}"`]
  if (p.dither) attrs.push(`:dither="${p.dither}"`)
  if (p.curvature) attrs.push(`:curvature="${p.curvature}"`)
  if (p.chromaticAberration) attrs.push(`:chromatic-aberration="${p.chromaticAberration}"`)
  return `<div class="relative h-56 overflow-hidden rounded-md">\n  <DitherFaultyTerminal ${attrs.join(" ")} />\n</div>`
})

// Ferrofluid playground — a rim palette and a flow direction; the code tab
// mirrors exactly what the preview renders.
const FLUID_PALETTES = {
  acid: ["#27FF64", "#7CFF67", "#A8FFB6"],
  magma: ["#FF3D2E", "#FF8A3D", "#FFD23D"],
  ice: ["#3DA5FF", "#7CE0FF", "#CFF6FF"],
  mono: ["#A8FFB6"],
} as const
type FluidPalette = keyof typeof FLUID_PALETTES
const FLUID_PALETTE_NAMES = Object.keys(FLUID_PALETTES) as FluidPalette[]
const FLOW_DIRS: FlowDirection[] = ["up", "down", "left", "right"]
const fluid = reactive({ palette: "acid" as FluidPalette, flow: "down" as FlowDirection })
const fluidColors = computed(() => [...FLUID_PALETTES[fluid.palette]])
const fluidCode = computed(
  () => `<div class="relative h-64 overflow-hidden rounded-md">\n  <DitherFerrofluid :colors='${JSON.stringify(fluidColors.value)}' flow-direction="${fluid.flow}" />\n</div>`
)

const wrap = (tag: string) => `<div class="relative h-64 overflow-hidden rounded-md">\n  ${tag}\n</div>`
const DEMO = {
  lineWaves: wrap('<DitherLineWaves />'),
  threads: wrap('<DitherThreads />'),
  silk: wrap('<DitherSilk />'),
  plasma: wrap('<DitherPlasma />'),
  iridescence: wrap('<DitherIridescence />'),
  dotGrid: wrap('<DitherDotGrid />'),
  rippleGrid: wrap('<DitherRippleGrid />'),
  pixelSnow: wrap('<DitherPixelSnow />'),
  beams: wrap('<DitherBeams />'),
  lightRays: wrap('<DitherLightRays />'),
  sideRays: wrap('<DitherSideRays />'),
  lightPillar: wrap('<DitherLightPillar />'),
  softAurora: wrap('<DitherSoftAurora />'),
  gridMotion: wrap('<DitherGridMotion />'),
  gridScan: wrap('<DitherGridScan />'),
  gridDistortion: wrap('<DitherGridDistortion />'),
  dotField: wrap('<DitherDotField />'),
  colorBends: wrap('<DitherColorBends />'),
  gradientBlinds: wrap('<DitherGradientBlinds />'),
  grainient: wrap('<DitherGrainient />'),
  plasmaWave: wrap('<DitherPlasmaWave />'),
  floatingLines: wrap('<DitherFloatingLines />'),
  radar: wrap('<DitherRadar />'),
  dither: wrap('<DitherDither />'),
  letterGlitch: wrap('<DitherLetterGlitch />'),
  shapeGrid: wrap('<DitherShapeGrid />'),
  lightning: wrap('<DitherLightning />'),
  orb: wrap('<DitherOrb />'),
  prism: wrap('<DitherPrism />'),
  galaxy: wrap('<DitherGalaxy />'),
  liquidChrome: wrap('<DitherLiquidChrome />'),
  darkVeil: wrap('<DitherDarkVeil />'),
}

const API: Record<string, PropRow[]> = {
  aurora: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67', '#5227FF']" },
    { prop: "amplitude", type: "number", default: "1" },
    { prop: "blend", type: "number 0…1", default: "0.5" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "opacity", type: "number 0…1", default: "1" },
    { prop: "dither", type: "number 0…1 | boolean", default: "1" },
    { prop: "paused", type: "boolean", default: "false" },
    { prop: "dpr", type: "number", default: "devicePixelRatio" },
    { prop: "mix-blend-mode", type: "string", default: "undefined" },
    { prop: "seed", type: "number", default: "undefined" },
    { prop: "render-mode", type: '"live" | "static"', default: '"live"' },
    { prop: "class", type: "string", default: "undefined" },
  ],
  waves: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
    { prop: "count", type: "number", default: "14" },
    { prop: "amplitude", type: "number", default: "0.5" },
    { prop: "frequency", type: "number", default: "2" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "line-width", type: "number (fraction of gap)", default: "0.18" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "opacity", type: "number 0…1", default: "1" },
    { prop: "dither", type: "number 0…1 | boolean", default: "1" },
    { prop: "mouse-interaction", type: "boolean", default: "true" },
    { prop: "mouse-strength", type: "number", default: "0.6" },
    { prop: "paused", type: "boolean", default: "false" },
    { prop: "dpr", type: "number", default: "devicePixelRatio" },
    { prop: "seed", type: "number", default: "undefined" },
    { prop: "render-mode", type: '"live" | "static"', default: '"live"' },
    { prop: "class", type: "string", default: "undefined" },
  ],
  lineWaves: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#3DA5FF', '#7CE0FF']" },
    { prop: "count", type: "number", default: "16" },
    { prop: "amplitude", type: "number", default: "0.5" },
    { prop: "frequency", type: "number", default: "2" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "line-width", type: "number (fraction of gap)", default: "0.16" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "opacity", type: "number 0…1", default: "1" },
    { prop: "dither", type: "number 0…1 | boolean", default: "1" },
    { prop: "paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  threads: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
    { prop: "count", type: "number", default: "22" },
    { prop: "amplitude", type: "number", default: "0.6" },
    { prop: "distortion", type: "number", default: "2" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "line-width", type: "number (fraction of gap)", default: "0.14" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "opacity", type: "number 0…1", default: "1" },
    { prop: "dither", type: "number 0…1 | boolean", default: "1" },
    { prop: "paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  silk: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67', '#5227FF']" },
    { prop: "scale", type: "number", default: "2" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "noise-intensity", type: "number", default: "1" },
    { prop: "rotation", type: "number (radians)", default: "0.6" },
    { prop: "sharpness", type: "number", default: "1.5" },
    { prop: "opacity", type: "number 0…1", default: "1" },
    { prop: "dither", type: "number 0…1 | boolean", default: "1" },
    { prop: "paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  plasma: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67', '#FFD23D']" },
    { prop: "scale", type: "number", default: "1" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "opacity", type: "number 0…1", default: "1" },
    { prop: "dither", type: "number 0…1 | boolean", default: "1" },
    { prop: "paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  iridescence: [
    { prop: "scale", type: "number", default: "2" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "saturation", type: "number 0…1", default: "0.85" },
    { prop: "brightness", type: "number 0…1", default: "0.9" },
    { prop: "opacity", type: "number 0…1", default: "1" },
    { prop: "dither", type: "number 0…1 | boolean", default: "1" },
    { prop: "paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  dotGrid: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
    { prop: "gap", type: "number (dots across)", default: "26" },
    { prop: "dot-size", type: "number 0…1 (of cell)", default: "0.5" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "opacity", type: "number 0…1", default: "1" },
    { prop: "dither", type: "number 0…1 | boolean", default: "1" },
    { prop: "mouse-interaction", type: "boolean", default: "true" },
    { prop: "mouse-strength", type: "number", default: "1" },
    { prop: "paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  rippleGrid: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#3DA5FF', '#7CE0FF', '#CFF6FF']" },
    { prop: "gap", type: "number (dots across)", default: "26" },
    { prop: "dot-size", type: "number 0…1 (of cell)", default: "0.6" },
    { prop: "frequency", type: "number", default: "26" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "opacity", type: "number 0…1", default: "1" },
    { prop: "dither", type: "number 0…1 | boolean", default: "1" },
    { prop: "paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  pixelSnow: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#CFF6FF', '#7CE0FF']" },
    { prop: "density", type: "number (flakes across)", default: "30" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "opacity", type: "number 0…1", default: "1" },
    { prop: "dither", type: "number 0…1 | boolean", default: "1" },
    { prop: "paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  beams: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
    { prop: "count", type: "number", default: "6" },
    { prop: "angle", type: "number (radians)", default: "0.6" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "sharpness", type: "number (higher = thinner)", default: "3" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  lightRays: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#FFD23D', '#FF8A3D']" },
    { prop: "ray-count", type: "number", default: "16" },
    { prop: "speed", type: "number", default: "0.4" },
    { prop: "spread", type: "number (fbm jitter)", default: "1.2" },
    { prop: "falloff", type: "number (distance fade)", default: "0.7" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  sideRays: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#3DA5FF', '#7CE0FF']" },
    { prop: "side", type: '"left" | "right"', default: '"left"' },
    { prop: "ray-count", type: "number", default: "12" },
    { prop: "speed / spread / falloff / glow", type: "number", default: "0.4 / 1 / 0.6 / 1.5" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  lightPillar: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
    { prop: "count", type: "number", default: "8" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "width", type: "number 0…1 (pillar thickness)", default: "0.4" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  softAurora: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67', '#A8FFB6']" },
    { prop: "bands", type: "number", default: "3" },
    { prop: "amplitude", type: "number", default: "1" },
    { prop: "blend", type: "number 0…1 (softness)", default: "0.6" },
    { prop: "speed", type: "number", default: "0.4" },
    { prop: "dither", type: "number 0…1 | boolean", default: "0.5" },
    { prop: "opacity / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  gridMotion: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#3DA5FF', '#7CE0FF']" },
    { prop: "count", type: "number (cells)", default: "14" },
    { prop: "angle", type: "number (drift direction)", default: "0.5" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "line-width", type: "number", default: "0.06" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  gridScan: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#27FF64', '#7CFF67']" },
    { prop: "count", type: "number (cells)", default: "16" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "line-width", type: "number", default: "0.05" },
    { prop: "scan-width", type: "number (bar softness)", default: "0.12" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  gridDistortion: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
    { prop: "count", type: "number (cells)", default: "14" },
    { prop: "distortion", type: "number (fbm warp)", default: "1" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "line-width", type: "number", default: "0.06" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "mouse-interaction", type: "boolean", default: "true" },
    { prop: "mouse-strength", type: "number", default: "1" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  dotField: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
    { prop: "gap", type: "number (dots across)", default: "26" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "size-variation", type: "number (radius breathe)", default: "1" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "mouse-interaction", type: "boolean", default: "true" },
    { prop: "mouse-strength", type: "number", default: "1" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  colorBends: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67', '#FFD23D']" },
    { prop: "scale", type: "number", default: "2" },
    { prop: "bend", type: "number (warp amount)", default: "0.4" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  gradientBlinds: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#FF3D2E', '#FFD23D']" },
    { prop: "count", type: "number (slats)", default: "8" },
    { prop: "angle", type: "number (radians)", default: "0.3" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "gap", type: "number 0…1 (slat spacing)", default: "0.15" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  grainient: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
    { prop: "angle", type: "number (gradient direction)", default: "0.6" },
    { prop: "grain", type: "number (noise amount)", default: "0.4" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  plasmaWave: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67', '#FFD23D']" },
    { prop: "scale", type: "number", default: "1" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "angle", type: "number (flow direction)", default: "0.6" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  floatingLines: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#3DA5FF', '#7CE0FF']" },
    { prop: "count", type: "number", default: "10" },
    { prop: "amplitude", type: "number (bob height)", default: "1" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "line-width", type: "number", default: "0.012" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  radar: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#27FF64', '#7CFF67']" },
    { prop: "rings", type: "number", default: "4" },
    { prop: "speed", type: "number (sweep rad/s)", default: "1" },
    { prop: "sweep-width", type: "number (trail length)", default: "0.6" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  dither: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#7CFF67', '#5227FF']" },
    { prop: "scale", type: "number", default: "3" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "opacity / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  letterGlitch: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#0A3A1A', '#27FF64', '#CFFFDF']" },
    { prop: "columns", type: "number", default: "24" },
    { prop: "speed", type: "number", default: "0.6" },
    { prop: "trail-length", type: "number 0…1", default: "0.5" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  shapeGrid: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
    { prop: "gap", type: "number (cells across)", default: "18" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  lightning: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CE0FF', '#FFFFFF']" },
    { prop: "bolts", type: "number", default: "3" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "jitter", type: "number (path wander)", default: "0.3" },
    { prop: "width", type: "number (bolt thickness)", default: "0.03" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  orb: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67', '#CFFFDF']" },
    { prop: "size", type: "number 0…1 (radius)", default: "0.5" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "noise-amount", type: "number (rim wobble)", default: "1" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  prism: [
    { prop: "spread", type: "number (fan half-angle)", default: "0.6" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "saturation", type: "number 0…1", default: "0.9" },
    { prop: "brightness", type: "number 0…1", default: "1" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  galaxy: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#3DA5FF', '#A8FFB6', '#FFFFFF']" },
    { prop: "arms", type: "number", default: "3" },
    { prop: "twist", type: "number (arm winding)", default: "8" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "density", type: "number 0…1 (star count)", default: "0.6" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  liquidChrome: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#1A1A22', '#8890A0', '#E8ECF4']" },
    { prop: "scale", type: "number", default: "2" },
    { prop: "speed", type: "number", default: "0.4" },
    { prop: "distortion", type: "number (fold amount)", default: "1" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  darkVeil: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#0A0A12', '#3A2A6A', '#5227FF']" },
    { prop: "scale", type: "number", default: "3" },
    { prop: "speed", type: "number", default: "0.4" },
    { prop: "intensity", type: "number (wisp strength)", default: "2.5" },
    { prop: "vignette", type: "number 0…1 (edge dark)", default: "0.7" },
    { prop: "opacity / dither / paused / dpr / seed / render-mode / class", type: "shared", default: "—" },
  ],
  faultyTerminal: [
    { prop: "scale", type: "number", default: "1.5" },
    { prop: "grid-mul", type: "[number, number]", default: "[2, 1]" },
    { prop: "digit-size", type: "number", default: "1.2" },
    { prop: "time-scale", type: "number", default: "1" },
    { prop: "pause", type: "boolean", default: "false" },
    { prop: "scanline-intensity", type: "number", default: "1" },
    { prop: "glitch-amount", type: "number", default: "1" },
    { prop: "flicker-amount", type: "number", default: "1" },
    { prop: "noise-amp", type: "number", default: "1" },
    { prop: "chromatic-aberration", type: "number (px)", default: "0" },
    { prop: "dither", type: "number 0…1 | boolean", default: "0" },
    { prop: "curvature", type: "number", default: "0" },
    { prop: "tint", type: "PixelColor (hex or seed)", default: '"#ffffff"' },
    { prop: "mouse-react", type: "boolean", default: "true" },
    { prop: "mouse-strength", type: "number", default: "0.5" },
    { prop: "page-load-animation", type: "boolean", default: "false" },
    { prop: "brightness", type: "number", default: "1" },
    { prop: "seed", type: "number", default: "undefined" },
    { prop: "render-mode", type: '"live" | "static"', default: '"live"' },
    { prop: "class", type: "string", default: "undefined" },
  ],
  ferrofluid: [
    { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#27FF64', '#7CFF67', '#A8FFB6']" },
    { prop: "speed", type: "number", default: "0.5" },
    { prop: "scale", type: "number", default: "1.6" },
    { prop: "turbulence", type: "number", default: "1" },
    { prop: "fluidity", type: "number", default: "0.1" },
    { prop: "rim-width", type: "number", default: "0.2" },
    { prop: "sharpness", type: "number", default: "2.5" },
    { prop: "shimmer", type: "number", default: "1.5" },
    { prop: "glow", type: "number", default: "2" },
    { prop: "flow-direction", type: '"up" | "down" | "left" | "right"', default: '"down"' },
    { prop: "opacity", type: "number 0…1", default: "1" },
    { prop: "dither", type: "number 0…1 | boolean", default: "1" },
    { prop: "mouse-interaction", type: "boolean", default: "true" },
    { prop: "mouse-strength", type: "number", default: "1" },
    { prop: "mouse-radius", type: "number", default: "0.35" },
    { prop: "mouse-dampening", type: "number (s)", default: "0.15" },
    { prop: "mix-blend-mode", type: "string", default: "undefined" },
    { prop: "paused", type: "boolean", default: "false" },
    { prop: "dpr", type: "number", default: "devicePixelRatio" },
    { prop: "seed", type: "number", default: "undefined" },
    { prop: "render-mode", type: '"live" | "static"', default: '"live"' },
    { prop: "class", type: "string", default: "undefined" },
  ],
}
</script>

<template>
  <!-- Aurora -->
  <section id="aurora" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Aurora</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Glowing polar curtains — a wavy light band hangs near the top, broken into
      vertical rays and tinted across the colour ramp by width. No WebGL: it
      draws through the same Bayer engine, so the glow comes out dithered.
      Fills its box.
    </p>
    <DemoCard :code="auroraCode">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
        <DitherAurora :colors="auroraColors" />
      </div>
      <div class="mt-5 flex flex-wrap items-center justify-center gap-4">
        <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
          <button v-for="pName in AURORA_PALETTE_NAMES" :key="pName" type="button" :aria-pressed="aurora.palette === pName" :class="chipClass(aurora.palette === pName)" @click="aurora.palette = pName">{{ pName }}</button>
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.aurora" />
  </section>

  <!-- Waves -->
  <section id="waves" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Waves</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A stack of horizontal contour lines flowing on an fbm field — each a thin
      glowing band that ripples with noise, tinted across the colour ramp by
      depth. Move the pointer to bend the nearest lines toward it. No WebGL: it
      draws through the same Bayer engine, so the lines come out dithered.
    </p>
    <DemoCard :code="wavesCode">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
        <DitherWaves :colors="wavesColors" />
      </div>
      <div class="mt-5 flex flex-wrap items-center justify-center gap-4">
        <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
          <button v-for="pName in WAVES_PALETTE_NAMES" :key="pName" type="button" :aria-pressed="waves.palette === pName" :class="chipClass(waves.palette === pName)" @click="waves.palette = pName">{{ pName }}</button>
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.waves" />
  </section>

  <!-- Line waves -->
  <section id="line-waves" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Line waves</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A clean sinusoidal contour stack — like Waves but purely sine, each line
      phase-shifted into a travelling interference pattern. Dithered.
    </p>
    <DemoCard :code="DEMO.lineWaves">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherLineWaves /></div>
    </DemoCard>
    <PropsTable :rows="API.lineWaves" />
  </section>

  <!-- Threads -->
  <section id="threads" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Threads</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Vertical filaments drifting on an fbm flow — thin glowing threads whose x
      wanders with noise, tinted across the ramp by depth. Dithered.
    </p>
    <DemoCard :code="DEMO.threads">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherThreads /></div>
    </DemoCard>
    <PropsTable :rows="API.threads" />
  </section>

  <!-- Silk -->
  <section id="silk" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Silk</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Flowing anisotropic sheen — fbm warps a rotated sine into liquid ribbons,
      tinted across the colour ramp. No WebGL; the sheen comes out dithered.
    </p>
    <DemoCard :code="DEMO.silk">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherSilk /></div>
    </DemoCard>
    <PropsTable :rows="API.silk" />
  </section>

  <!-- Plasma -->
  <section id="plasma" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Plasma</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The classic layered-sine plasma, mapped across the colour ramp. Ordered
      dithering bands the gradient into the kit's crunch instead of a smooth blend.
    </p>
    <DemoCard :code="DEMO.plasma">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60"><DitherPlasma /></div>
    </DemoCard>
    <PropsTable :rows="API.plasma" />
  </section>

  <!-- Iridescence -->
  <section id="iridescence" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Iridescence</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A shifting soap-bubble sheen — fbm perturbs an HSV hue swept across the
      surface; ordered dithering bands the rainbow. Self-tinting, no colours prop.
    </p>
    <DemoCard :code="DEMO.iridescence">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60"><DitherIridescence /></div>
    </DemoCard>
    <PropsTable :rows="API.iridescence" />
  </section>

  <!-- Dot grid -->
  <section id="dot-grid" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Dot grid</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A lattice of round dots pulsing on fbm, brightened under the cursor — cells
      stay square via the aspect ratio, tinted across the ramp by row. Move the pointer.
    </p>
    <DemoCard :code="DEMO.dotGrid">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherDotGrid /></div>
    </DemoCard>
    <PropsTable :rows="API.dotGrid" />
  </section>

  <!-- Ripple grid -->
  <section id="ripple-grid" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Ripple grid</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A lattice of dots brightened by concentric ripples expanding from the
      centre — tinted across the ramp by ring. Dithered.
    </p>
    <DemoCard :code="DEMO.rippleGrid">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherRippleGrid /></div>
    </DemoCard>
    <PropsTable :rows="API.rippleGrid" />
  </section>

  <!-- Pixel snow -->
  <section id="pixel-snow" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Pixel snow</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Sparse flakes drifting down a hashed grid — each cell hashes to a flake or
      empty, falling as time advances. Tinted across the ramp by depth, dithered.
    </p>
    <DemoCard :code="DEMO.pixelSnow">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherPixelSnow /></div>
    </DemoCard>
    <PropsTable :rows="API.pixelSnow" />
  </section>

  <!-- Beams -->
  <section id="beams" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Beams</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Parallel light beams sweeping at an angle — a rotated coordinate banded by a
      sharpened sine that scrolls over time, tinted across the ramp. Dithered.
    </p>
    <DemoCard :code="DEMO.beams">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherBeams /></div>
    </DemoCard>
    <PropsTable :rows="API.beams" />
  </section>

  <!-- Light rays -->
  <section id="light-rays" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Light rays</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      God rays fanning from a source above — the angle to the source is banded by
      a sharpened sine, jittered with fbm and faded by distance. Dithered.
    </p>
    <DemoCard :code="DEMO.lightRays">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherLightRays /></div>
    </DemoCard>
    <PropsTable :rows="API.lightRays" />
  </section>

  <!-- Side rays -->
  <section id="side-rays" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Side rays</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The same god-ray fan, but the source sits off a side edge for horizontal
      streaks — flip <code class="text-foreground/80">side</code> to left or right.
    </p>
    <DemoCard :code="DEMO.sideRays">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherSideRays /></div>
    </DemoCard>
    <PropsTable :rows="API.sideRays" />
  </section>

  <!-- Light pillar -->
  <section id="light-pillar" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Light pillar</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Vertical light columns shimmering upward — fbm nudges the positions, a
      sharpened sine makes the pillars, brighter at the base. Dithered.
    </p>
    <DemoCard :code="DEMO.lightPillar">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherLightPillar /></div>
    </DemoCard>
    <PropsTable :rows="API.lightPillar" />
  </section>

  <!-- Soft aurora -->
  <section id="soft-aurora" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Soft aurora</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Several overlapping soft curtains accumulating into a gentle glow — wider
      falloff and a lower default dither than Aurora for a hazier look.
    </p>
    <DemoCard :code="DEMO.softAurora">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherSoftAurora /></div>
    </DemoCard>
    <PropsTable :rows="API.softAurora" />
  </section>

  <!-- Grid motion -->
  <section id="grid-motion" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Grid motion</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A scrolling line grid drifting in a direction — cells stay square via the
      aspect ratio, tinted across the ramp by depth. Dithered.
    </p>
    <DemoCard :code="DEMO.gridMotion">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherGridMotion /></div>
    </DemoCard>
    <PropsTable :rows="API.gridMotion" />
  </section>

  <!-- Grid scan -->
  <section id="grid-scan" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Grid scan</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A faint static grid with a bright bar sweeping down it, boosting gridline
      intensity as it passes. Dithered.
    </p>
    <DemoCard :code="DEMO.gridScan">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherGridScan /></div>
    </DemoCard>
    <PropsTable :rows="API.gridScan" />
  </section>

  <!-- Grid distortion -->
  <section id="grid-distortion" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Grid distortion</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A line grid warped by an fbm flow and the cursor — coordinates are displaced
      before the grid is sampled. Move the pointer to push it around.
    </p>
    <DemoCard :code="DEMO.gridDistortion">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherGridDistortion /></div>
    </DemoCard>
    <PropsTable :rows="API.gridDistortion" />
  </section>

  <!-- Dot field -->
  <section id="dot-field" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Dot field</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A lattice of dots whose radius breathes with fbm and swells under the
      cursor — tinted across the ramp by row. Move the pointer to bloom them.
    </p>
    <DemoCard :code="DEMO.dotField">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherDotField /></div>
    </DemoCard>
    <PropsTable :rows="API.dotField" />
  </section>

  <!-- Color bends -->
  <section id="color-bends" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Color bends</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Smooth colour bands undulating on an fbm warp — the ramp index is bent by
      noise so the bands ripple. Ordered dithering crunches the gradient.
    </p>
    <DemoCard :code="DEMO.colorBends">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60"><DitherColorBends /></div>
    </DemoCard>
    <PropsTable :rows="API.colorBends" />
  </section>

  <!-- Gradient blinds -->
  <section id="gradient-blinds" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Gradient blinds</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Angled slats each showing a colour-ramp gradient, separated by thin
      transparent gaps and sliding over time. Dithered within each slat.
    </p>
    <DemoCard :code="DEMO.gradientBlinds">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherGradientBlinds /></div>
    </DemoCard>
    <PropsTable :rows="API.gradientBlinds" />
  </section>

  <!-- Grainient -->
  <section id="grainient" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Grainient</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A directional colour gradient dusted with animated grain — per-pixel hash
      noise breaks up the ramp; ordered dithering adds the crunch on top.
    </p>
    <DemoCard :code="DEMO.grainient">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60"><DitherGrainient /></div>
    </DemoCard>
    <PropsTable :rows="API.grainient" />
  </section>

  <!-- Plasma wave -->
  <section id="plasma-wave" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Plasma wave</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Directional plasma with wavefronts travelling along an axis — sines along
      and across the flow sum into a value mapped across the ramp. Dithered.
    </p>
    <DemoCard :code="DEMO.plasmaWave">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60"><DitherPlasmaWave /></div>
    </DemoCard>
    <PropsTable :rows="API.plasmaWave" />
  </section>

  <!-- Floating lines -->
  <section id="floating-lines" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Floating lines</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A few thin horizontal lines bobbing and drifting independently, each with
      its own phase — tinted across the ramp by line. Dithered.
    </p>
    <DemoCard :code="DEMO.floatingLines">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherFloatingLines /></div>
    </DemoCard>
    <PropsTable :rows="API.floatingLines" />
  </section>

  <!-- Radar -->
  <section id="radar-sweep" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Radar</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A rotating sweep with an afterglow trail over concentric rings — the scope
      is circular, tinted across the ramp by radius. Dithered.
    </p>
    <DemoCard :code="DEMO.radar">
      <div class="relative mx-auto aspect-square h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherRadar /></div>
    </DemoCard>
    <PropsTable :rows="API.radar" />
  </section>

  <!-- Dither -->
  <section id="dither" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Dither</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The kit's signature at its purest — an animated fbm cloud thresholded 1-bit
      against the Bayer matrix, so the whole surface IS the ordered dither.
    </p>
    <DemoCard :code="DEMO.dither">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherDither /></div>
    </DemoCard>
    <PropsTable :rows="API.dither" />
  </section>

  <!-- Letter glitch -->
  <section id="letter-glitch" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Letter glitch</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Matrix-style glyph rain — each column drops a bright head with a trailing
      fade; every cell holds a hashed 3x5 glyph. Tinted by brightness, dithered.
    </p>
    <DemoCard :code="DEMO.letterGlitch">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherLetterGlitch /></div>
    </DemoCard>
    <PropsTable :rows="API.letterGlitch" />
  </section>

  <!-- Shape grid -->
  <section id="shape-grid" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Shape grid</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A lattice where each cell holds a hashed shape — square, diamond, plus or
      ring — pulsing on its own phase. Tinted across the ramp, dithered.
    </p>
    <DemoCard :code="DEMO.shapeGrid">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherShapeGrid /></div>
    </DemoCard>
    <PropsTable :rows="API.shapeGrid" />
  </section>

  <!-- Lightning -->
  <section id="lightning" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Lightning</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Jagged fbm-displaced bolts flickering in bursts — each a thin glowing line
      wandering vertically, wider toward the ground. Dithered.
    </p>
    <DemoCard :code="DEMO.lightning">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherLightning /></div>
    </DemoCard>
    <PropsTable :rows="API.lightning" />
  </section>

  <!-- Orb -->
  <section id="orb" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Orb</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A glowing pulsing sphere with a wobbling rim — fbm perturbs the radius for
      a plasma edge; a core glow plus a rim ring tint across the ramp by radius.
    </p>
    <DemoCard :code="DEMO.orb">
      <div class="relative mx-auto aspect-square h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherOrb /></div>
    </DemoCard>
    <PropsTable :rows="API.orb" />
  </section>

  <!-- Prism -->
  <section id="prism" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Prism</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A spectral light fan dispersing from above — the angle across the fan maps
      to an HSV hue, so the beam splits into a rainbow. Self-colouring, dithered.
    </p>
    <DemoCard :code="DEMO.prism">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherPrism /></div>
    </DemoCard>
    <PropsTable :rows="API.prism" />
  </section>

  <!-- Galaxy -->
  <section id="galaxy" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Galaxy</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A rotating spiral of twinkling stars with a bright core — spiral arms
      modulate a hashed star density; inner stars rotate faster. Dithered.
    </p>
    <DemoCard :code="DEMO.galaxy">
      <div class="relative mx-auto aspect-square h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DitherGalaxy /></div>
    </DemoCard>
    <PropsTable :rows="API.galaxy" />
  </section>

  <!-- Liquid chrome -->
  <section id="liquid-chrome" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Liquid chrome</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Molten metal — iterative domain warping folds the coordinates into rippled
      reflective bands; a high-contrast sine reads them as chrome. Dithered.
    </p>
    <DemoCard :code="DEMO.liquidChrome">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60"><DitherLiquidChrome /></div>
    </DemoCard>
    <PropsTable :rows="API.liquidChrome" />
  </section>

  <!-- Dark veil -->
  <section id="dark-veil" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Dark veil</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A moody near-black wash with faint colour wisps and an edge vignette —
      sparse fbm highlights climb the ramp; dithering crunches the low light.
    </p>
    <DemoCard :code="DEMO.darkVeil">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60"><DitherDarkVeil /></div>
    </DemoCard>
    <PropsTable :rows="API.darkVeil" />
  </section>

  <!-- Faulty terminal -->
  <section id="faulty-terminal" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Faulty terminal</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A CRT glyph wall — animated value-noise lights a grid of characters, then
      scanlines, glitch, flicker, chromatic aberration and barrel curvature run
      over it. No WebGL: it draws through the same Bayer engine as everything
      else, so <code class="text-foreground/80">dither</code> is just an
      intensity from smooth to hard 1-bit. Fills its box; move the pointer over it.
    </p>
    <DemoCard :code="termCode">
      <div class="relative h-56 overflow-hidden rounded-md border border-border/60">
        <DitherFaultyTerminal
          :tint="term.tint"
          :scale="termParams.scale"
          :glitch-amount="termParams.glitchAmount"
          :scanline-intensity="termParams.scanlineIntensity"
          :dither="termParams.dither"
          :curvature="termParams.curvature"
          :chromatic-aberration="termParams.chromaticAberration"
        />
      </div>
      <div class="mt-5 flex flex-wrap items-center justify-center gap-4">
        <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
          <button v-for="pName in TERM_PRESET_NAMES" :key="pName" type="button" :aria-pressed="term.preset === pName" :class="chipClass(term.preset === pName)" @click="term.preset = pName">{{ pName }}</button>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-for="c in COLORS"
            :key="c"
            type="button"
            :aria-label="`Tint ${c}`"
            :aria-pressed="term.tint === c"
            class="size-6 rounded-[4px] transition-transform"
            :class="term.tint === c ? 'ring-1 ring-foreground ring-offset-2 ring-offset-background' : 'hover:scale-110'"
            :style="{ backgroundColor: cssColor(c) }"
            @click="term.tint = c"
          />
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.faultyTerminal" />
  </section>

  <!-- Ferrofluid -->
  <section id="ferrofluid" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Ferrofluid</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Two fluid layers merge into metaball blobs; their contour rim glows,
      tinted across the array of colors by height. Turbulence swirls the domain,
      shimmer grains the lines, and the pointer raises a magnetic spike. No
      WebGL — it draws through the same Bayer engine, so the rim comes out
      crunchy. Fills its box.
    </p>
    <DemoCard :code="fluidCode">
      <div class="relative h-64 overflow-hidden rounded-md border border-border/60">
        <DitherFerrofluid :colors="fluidColors" :flow-direction="fluid.flow" />
      </div>
      <div class="mt-5 flex flex-wrap items-center justify-center gap-4">
        <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
          <button v-for="pName in FLUID_PALETTE_NAMES" :key="pName" type="button" :aria-pressed="fluid.palette === pName" :class="chipClass(fluid.palette === pName)" @click="fluid.palette = pName">{{ pName }}</button>
        </div>
        <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
          <button v-for="dir in FLOW_DIRS" :key="dir" type="button" :aria-pressed="fluid.flow === dir" :class="chipClass(fluid.flow === dir)" @click="fluid.flow = dir">{{ dir }}</button>
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.ferrofluid" />
  </section>
</template>
