<script lang="ts">
  import {
    Aurora,
    Waves,
    LineWaves,
    Threads,
    Silk,
    Plasma,
    Iridescence,
    DotGrid,
    RippleGrid,
    PixelSnow,
    Beams,
    LightRays,
    SideRays,
    LightPillar,
    SoftAurora,
    GridMotion,
    GridScan,
    GridDistortion,
    DotField,
    ColorBends,
    GradientBlinds,
    Grainient,
    PlasmaWave,
    FloatingLines,
    Radar,
    Dither,
    LetterGlitch,
    ShapeGrid,
    Lightning,
    Orb,
    Prism,
    Galaxy,
    LiquidChrome,
    DarkVeil,
    Balatro,
    LiquidEther,
    Ballpit,
    Particles,
    Hyperspeed,
    Lightfall,
    PixelBlast,
    PrismaticBurst,
    EvilEye,
    FaultyTerminal,
    Ferrofluid,
    cssColor,
    type DitherColor,
    type FlowDirection,
  } from "@dither-kit-svelte"
  import DemoCard from "./DemoCard.svelte"
  import PropsTable, { type PropRow } from "./PropsTable.svelte"

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
  const aurora = $state<{ palette: AuroraPalette }>({ palette: "polar" })
  const auroraColors = $derived([...AURORA_PALETTES[aurora.palette]])
  const auroraCode = $derived(
    `<div class="relative h-64 overflow-hidden rounded-md">\n  <Aurora colors={${JSON.stringify(auroraColors)}} class="absolute inset-0" />\n</div>`
  )

  // Waves playground — a colour ramp preset; the code tab mirrors it.
  const WAVES_PALETTES = {
    aurora: ["#5227FF", "#7CFF67"],
    ocean: ["#3DA5FF", "#7CE0FF"],
    sunset: ["#FF3D2E", "#FFD23D"],
  } as const
  type WavesPalette = keyof typeof WAVES_PALETTES
  const WAVES_PALETTE_NAMES = Object.keys(WAVES_PALETTES) as WavesPalette[]
  const waves = $state<{ palette: WavesPalette }>({ palette: "aurora" })
  const wavesColors = $derived([...WAVES_PALETTES[waves.palette]])
  const wavesCode = $derived(
    `<div class="relative h-64 overflow-hidden rounded-md">\n  <Waves colors={${JSON.stringify(wavesColors)}} class="absolute inset-0" />\n</div>`
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
  const term = $state<{ tint: DitherColor; preset: TermPreset }>({ tint: "green", preset: "signal" })
  const termParams = $derived(TERM_PRESETS[term.preset])
  const termCode = $derived.by(() => {
    const p = termParams
    const attrs = [
      `tint="${term.tint}"`,
      `scale={${p.scale}}`,
      `glitchAmount={${p.glitchAmount}}`,
      `scanlineIntensity={${p.scanlineIntensity}}`,
    ]
    if (p.dither) attrs.push(`dither={${p.dither}}`)
    if (p.curvature) attrs.push(`curvature={${p.curvature}}`)
    if (p.chromaticAberration) attrs.push(`chromaticAberration={${p.chromaticAberration}}`)
    return `<div class="relative h-56 overflow-hidden rounded-md">\n  <FaultyTerminal ${attrs.join(" ")} class="absolute inset-0" />\n</div>`
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
  const fluid = $state<{ palette: FluidPalette; flow: FlowDirection }>({ palette: "acid", flow: "down" })
  const fluidColors = $derived([...FLUID_PALETTES[fluid.palette]])
  const fluidCode = $derived(
    `<div class="relative h-64 overflow-hidden rounded-md">\n  <Ferrofluid colors={${JSON.stringify(fluidColors)}} flowDirection="${fluid.flow}" class="absolute inset-0" />\n</div>`
  )

  const wrap = (tag: string) => `<div class="relative h-64 overflow-hidden rounded-md">\n  ${tag}\n</div>`
  const DEMO = {
    lineWaves: wrap('<LineWaves class="absolute inset-0" />'),
    threads: wrap('<Threads class="absolute inset-0" />'),
    silk: wrap('<Silk class="absolute inset-0" />'),
    plasma: wrap('<Plasma class="absolute inset-0" />'),
    iridescence: wrap('<Iridescence class="absolute inset-0" />'),
    dotGrid: wrap('<DotGrid class="absolute inset-0" />'),
    rippleGrid: wrap('<RippleGrid class="absolute inset-0" />'),
    pixelSnow: wrap('<PixelSnow class="absolute inset-0" />'),
    beams: wrap('<Beams class="absolute inset-0" />'),
    lightRays: wrap('<LightRays class="absolute inset-0" />'),
    sideRays: wrap('<SideRays class="absolute inset-0" />'),
    lightPillar: wrap('<LightPillar class="absolute inset-0" />'),
    softAurora: wrap('<SoftAurora class="absolute inset-0" />'),
    gridMotion: wrap('<GridMotion class="absolute inset-0" />'),
    gridScan: wrap('<GridScan class="absolute inset-0" />'),
    gridDistortion: wrap('<GridDistortion class="absolute inset-0" />'),
    dotField: wrap('<DotField class="absolute inset-0" />'),
    colorBends: wrap('<ColorBends class="absolute inset-0" />'),
    gradientBlinds: wrap('<GradientBlinds class="absolute inset-0" />'),
    grainient: wrap('<Grainient class="absolute inset-0" />'),
    plasmaWave: wrap('<PlasmaWave class="absolute inset-0" />'),
    floatingLines: wrap('<FloatingLines class="absolute inset-0" />'),
    radar: wrap('<Radar class="absolute inset-0" />'),
    dither: wrap('<Dither class="absolute inset-0" />'),
    letterGlitch: wrap('<LetterGlitch class="absolute inset-0" />'),
    shapeGrid: wrap('<ShapeGrid class="absolute inset-0" />'),
    lightning: wrap('<Lightning class="absolute inset-0" />'),
    orb: wrap('<Orb class="absolute inset-0" />'),
    prism: wrap('<Prism class="absolute inset-0" />'),
    galaxy: wrap('<Galaxy class="absolute inset-0" />'),
    liquidChrome: wrap('<LiquidChrome class="absolute inset-0" />'),
    darkVeil: wrap('<DarkVeil class="absolute inset-0" />'),
    balatro: wrap('<Balatro class="absolute inset-0" />'),
    liquidEther: wrap('<LiquidEther class="absolute inset-0" />'),
    ballpit: wrap('<Ballpit class="absolute inset-0" />'),
    particles: wrap('<Particles class="absolute inset-0" />'),
    hyperspeed: wrap('<Hyperspeed class="absolute inset-0" />'),
    lightfall: wrap('<Lightfall class="absolute inset-0" />'),
    pixelBlast: wrap('<PixelBlast class="absolute inset-0" />'),
    prismaticBurst: wrap('<PrismaticBurst class="absolute inset-0" />'),
    evilEye: wrap('<EvilEye class="absolute inset-0" />'),
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
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    waves: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
      { prop: "count", type: "number", default: "14" },
      { prop: "amplitude", type: "number", default: "0.5" },
      { prop: "frequency", type: "number", default: "2" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "lineWidth", type: "number (fraction of gap)", default: "0.18" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "mouseInteraction", type: "boolean", default: "true" },
      { prop: "mouseStrength", type: "number", default: "0.6" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    lineWaves: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#3DA5FF', '#7CE0FF']" },
      { prop: "count", type: "number", default: "16" },
      { prop: "amplitude", type: "number", default: "0.5" },
      { prop: "frequency", type: "number", default: "2" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "lineWidth", type: "number (fraction of gap)", default: "0.16" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    threads: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
      { prop: "count", type: "number", default: "22" },
      { prop: "amplitude", type: "number", default: "0.6" },
      { prop: "distortion", type: "number", default: "2" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "lineWidth", type: "number (fraction of gap)", default: "0.14" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    silk: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67', '#5227FF']" },
      { prop: "scale", type: "number", default: "2" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "noiseIntensity", type: "number", default: "1" },
      { prop: "rotation", type: "number (radians)", default: "0.6" },
      { prop: "sharpness", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    plasma: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67', '#FFD23D']" },
      { prop: "scale", type: "number", default: "1" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    iridescence: [
      { prop: "scale", type: "number", default: "2" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "saturation", type: "number 0…1", default: "0.85" },
      { prop: "brightness", type: "number 0…1", default: "0.9" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    dotGrid: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
      { prop: "gap", type: "number (dots across)", default: "26" },
      { prop: "dotSize", type: "number 0…1 (of cell)", default: "0.5" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "mouseInteraction", type: "boolean", default: "true" },
      { prop: "mouseStrength", type: "number", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    rippleGrid: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#3DA5FF', '#7CE0FF', '#CFF6FF']" },
      { prop: "gap", type: "number (dots across)", default: "26" },
      { prop: "dotSize", type: "number 0…1 (of cell)", default: "0.6" },
      { prop: "frequency", type: "number", default: "26" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    pixelSnow: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#CFF6FF', '#7CE0FF']" },
      { prop: "density", type: "number (flakes across)", default: "30" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    beams: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
      { prop: "count", type: "number", default: "6" },
      { prop: "angle", type: "number (radians)", default: "0.6" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "sharpness", type: "number (higher = thinner)", default: "3" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    lightRays: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#FFD23D', '#FF8A3D']" },
      { prop: "rayCount", type: "number", default: "16" },
      { prop: "speed", type: "number", default: "0.4" },
      { prop: "spread", type: "number (fbm jitter)", default: "1.2" },
      { prop: "falloff", type: "number (distance fade)", default: "0.7" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    sideRays: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#3DA5FF', '#7CE0FF']" },
      { prop: "side", type: '"left" | "right"', default: '"left"' },
      { prop: "rayCount", type: "number", default: "12" },
      { prop: "speed", type: "number", default: "0.4" },
      { prop: "spread", type: "number", default: "1" },
      { prop: "falloff", type: "number", default: "0.6" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    lightPillar: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
      { prop: "count", type: "number", default: "8" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "width", type: "number 0…1 (pillar thickness)", default: "0.4" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    softAurora: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67', '#A8FFB6']" },
      { prop: "bands", type: "number", default: "3" },
      { prop: "amplitude", type: "number", default: "1" },
      { prop: "blend", type: "number 0…1 (softness)", default: "0.6" },
      { prop: "speed", type: "number", default: "0.4" },
      { prop: "dither", type: "number 0…1 | boolean", default: "0.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    gridMotion: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#3DA5FF', '#7CE0FF']" },
      { prop: "count", type: "number (cells)", default: "14" },
      { prop: "angle", type: "number (drift direction)", default: "0.5" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "lineWidth", type: "number", default: "0.06" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    gridScan: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#27FF64', '#7CFF67']" },
      { prop: "count", type: "number (cells)", default: "16" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "lineWidth", type: "number", default: "0.05" },
      { prop: "scanWidth", type: "number (bar softness)", default: "0.12" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    gridDistortion: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
      { prop: "count", type: "number (cells)", default: "14" },
      { prop: "distortion", type: "number (fbm warp)", default: "1" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "lineWidth", type: "number", default: "0.06" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "mouseInteraction", type: "boolean", default: "true" },
      { prop: "mouseStrength", type: "number", default: "1" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    dotField: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
      { prop: "gap", type: "number (dots across)", default: "26" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "sizeVariation", type: "number (radius breathe)", default: "1" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "mouseInteraction", type: "boolean", default: "true" },
      { prop: "mouseStrength", type: "number", default: "1" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    colorBends: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67', '#FFD23D']" },
      { prop: "scale", type: "number", default: "2" },
      { prop: "bend", type: "number (warp amount)", default: "0.4" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    gradientBlinds: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#FF3D2E', '#FFD23D']" },
      { prop: "count", type: "number (slats)", default: "8" },
      { prop: "angle", type: "number (radians)", default: "0.3" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "gap", type: "number 0…1 (slat spacing)", default: "0.15" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    grainient: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
      { prop: "angle", type: "number (gradient direction)", default: "0.6" },
      { prop: "grain", type: "number (noise amount)", default: "0.4" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    plasmaWave: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67', '#FFD23D']" },
      { prop: "scale", type: "number", default: "1" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "angle", type: "number (flow direction)", default: "0.6" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    floatingLines: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#3DA5FF', '#7CE0FF']" },
      { prop: "count", type: "number", default: "10" },
      { prop: "amplitude", type: "number (bob height)", default: "1" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "lineWidth", type: "number", default: "0.012" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    radar: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#27FF64', '#7CFF67']" },
      { prop: "rings", type: "number", default: "4" },
      { prop: "speed", type: "number (sweep rad/s)", default: "1" },
      { prop: "sweepWidth", type: "number (trail length)", default: "0.6" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    dither: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#7CFF67', '#5227FF']" },
      { prop: "scale", type: "number", default: "3" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    letterGlitch: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#0A3A1A', '#27FF64', '#CFFFDF']" },
      { prop: "columns", type: "number", default: "24" },
      { prop: "speed", type: "number", default: "0.6" },
      { prop: "trailLength", type: "number 0…1", default: "0.5" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    shapeGrid: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67']" },
      { prop: "gap", type: "number (cells across)", default: "18" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    lightning: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CE0FF', '#FFFFFF']" },
      { prop: "bolts", type: "number", default: "3" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "jitter", type: "number (path wander)", default: "0.3" },
      { prop: "width", type: "number (bolt thickness)", default: "0.03" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    orb: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67', '#CFFFDF']" },
      { prop: "size", type: "number 0…1 (radius)", default: "0.5" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "noiseAmount", type: "number (rim wobble)", default: "1" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    prism: [
      { prop: "spread", type: "number (fan half-angle)", default: "0.6" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "saturation", type: "number 0…1", default: "0.9" },
      { prop: "brightness", type: "number 0…1", default: "1" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    galaxy: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#3DA5FF', '#A8FFB6', '#FFFFFF']" },
      { prop: "arms", type: "number", default: "3" },
      { prop: "twist", type: "number (arm winding)", default: "8" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "density", type: "number 0…1 (star count)", default: "0.6" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    liquidChrome: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#1A1A22', '#8890A0', '#E8ECF4']" },
      { prop: "scale", type: "number", default: "2" },
      { prop: "speed", type: "number", default: "0.4" },
      { prop: "distortion", type: "number (fold amount)", default: "1" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    darkVeil: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#0A0A12', '#3A2A6A', '#5227FF']" },
      { prop: "scale", type: "number", default: "3" },
      { prop: "speed", type: "number", default: "0.4" },
      { prop: "intensity", type: "number (wisp strength)", default: "2.5" },
      { prop: "vignette", type: "number 0…1 (edge dark)", default: "0.7" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    balatro: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#FF3D2E', '#FFD23D', '#27FF64']" },
      { prop: "scale", type: "number", default: "2" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "spin", type: "number (swirl)", default: "3" },
      { prop: "contrast", type: "number", default: "1" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    liquidEther: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67', '#3DA5FF']" },
      { prop: "scale", type: "number", default: "2" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "flow", type: "number (advection)", default: "1" },
      { prop: "mouseInteraction", type: "boolean", default: "true" },
      { prop: "mouseStrength", type: "number", default: "1" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    ballpit: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CFF67', '#FF3D2E']" },
      { prop: "count", type: "number (balls across)", default: "12" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "ballSize", type: "number", default: "0.8" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "mouseInteraction", type: "boolean", default: "true" },
      { prop: "mouseStrength", type: "number", default: "1" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    particles: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#3DA5FF', '#7CFF67', '#FFFFFF']" },
      { prop: "count", type: "number", default: "20" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "particleSize", type: "number", default: "0.7" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "mouseInteraction", type: "boolean", default: "true" },
      { prop: "mouseStrength", type: "number", default: "1" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    hyperspeed: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#3DA5FF', '#7CE0FF', '#FFFFFF']" },
      { prop: "count", type: "number (lanes)", default: "24" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "streakLength", type: "number", default: "0.5" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    lightfall: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#7CE0FF', '#CFFFFF']" },
      { prop: "count", type: "number (columns)", default: "16" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "trailLength", type: "number", default: "0.6" },
      { prop: "width", type: "number", default: "0.06" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    pixelBlast: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#5227FF', '#FF3D2E', '#FFD23D']" },
      { prop: "waves", type: "number (rings)", default: "3" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "pixels", type: "number (block density)", default: "40" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    prismaticBurst: [
      { prop: "rays", type: "number", default: "8" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "spread", type: "number (ray sharpness)", default: "2" },
      { prop: "saturation", type: "number 0…1", default: "0.9" },
      { prop: "brightness", type: "number 0…1", default: "1" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    evilEye: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#0A0A0A', '#FF3D2E', '#FFD23D']" },
      { prop: "size", type: "number", default: "0.55" },
      { prop: "speed", type: "number (blink/iris)", default: "0.5" },
      { prop: "pupilSize", type: "number 0…1", default: "0.4" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "mouseInteraction", type: "boolean", default: "true" },
      { prop: "mouseStrength", type: "number", default: "1" },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    faultyTerminal: [
      { prop: "scale", type: "number", default: "1.5" },
      { prop: "gridMul", type: "[number, number]", default: "[2, 1]" },
      { prop: "digitSize", type: "number", default: "1.2" },
      { prop: "timeScale", type: "number", default: "1" },
      { prop: "pause", type: "boolean", default: "false" },
      { prop: "scanlineIntensity", type: "number", default: "1" },
      { prop: "glitchAmount", type: "number", default: "1" },
      { prop: "flickerAmount", type: "number", default: "1" },
      { prop: "noiseAmp", type: "number", default: "1" },
      { prop: "chromaticAberration", type: "number (px)", default: "0" },
      { prop: "dither", type: "number 0…1 | boolean", default: "0" },
      { prop: "curvature", type: "number", default: "0" },
      { prop: "tint", type: "PixelColor (hex or seed)", default: '"#ffffff"' },
      { prop: "mouseReact", type: "boolean", default: "true" },
      { prop: "mouseStrength", type: "number", default: "0.5" },
      { prop: "pageLoadAnimation", type: "boolean", default: "false" },
      { prop: "brightness", type: "number", default: "1" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    ferrofluid: [
      { prop: "colors", type: "string[] (≤ 8 hex)", default: "['#27FF64', '#7CFF67', '#A8FFB6']" },
      { prop: "speed", type: "number", default: "0.5" },
      { prop: "scale", type: "number", default: "1.6" },
      { prop: "turbulence", type: "number", default: "1" },
      { prop: "fluidity", type: "number", default: "0.1" },
      { prop: "rimWidth", type: "number", default: "0.2" },
      { prop: "sharpness", type: "number", default: "2.5" },
      { prop: "shimmer", type: "number", default: "1.5" },
      { prop: "glow", type: "number", default: "2" },
      { prop: "flowDirection", type: '"up" | "down" | "left" | "right"', default: '"down"' },
      { prop: "opacity", type: "number 0…1", default: "1" },
      { prop: "dither", type: "number 0…1 | boolean", default: "1" },
      { prop: "mouseInteraction", type: "boolean", default: "true" },
      { prop: "mouseStrength", type: "number", default: "1" },
      { prop: "mouseRadius", type: "number", default: "0.35" },
      { prop: "mouseDampening", type: "number (s)", default: "0.15" },
      { prop: "mixBlendMode", type: "string", default: "undefined" },
      { prop: "paused", type: "boolean", default: "false" },
      { prop: "dpr", type: "number", default: "devicePixelRatio" },
      { prop: "seed", type: "number", default: "undefined" },
      { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
  }
</script>

<!-- Aurora -->
<section id="aurora" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Aurora</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Glowing polar curtains — a wavy light band hangs near the top, broken into
    vertical rays and tinted across the colour ramp by width. No WebGL: it
    draws through the same Bayer engine, so the glow comes out dithered.
    Fills its box.
  </p>
  <DemoCard code={auroraCode}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
      <Aurora colors={auroraColors} class="absolute inset-0" />
    </div>
    <div class="mt-5 flex flex-wrap items-center justify-center gap-4">
      <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
        {#each AURORA_PALETTE_NAMES as pName (pName)}
          <button type="button" aria-pressed={aurora.palette === pName} class={chipClass(aurora.palette === pName)} onclick={() => (aurora.palette = pName)}>{pName}</button>
        {/each}
      </div>
    </div>
  </DemoCard>
  <PropsTable rows={API.aurora} />
</section>

<!-- Waves -->
<section id="waves" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Waves</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A stack of horizontal contour lines flowing on an fbm field — each a thin
    glowing band that ripples with noise, tinted across the colour ramp by
    depth. Move the pointer to bend the nearest lines toward it. No WebGL: it
    draws through the same Bayer engine, so the lines come out dithered.
  </p>
  <DemoCard code={wavesCode}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
      <Waves colors={wavesColors} class="absolute inset-0" />
    </div>
    <div class="mt-5 flex flex-wrap items-center justify-center gap-4">
      <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
        {#each WAVES_PALETTE_NAMES as pName (pName)}
          <button type="button" aria-pressed={waves.palette === pName} class={chipClass(waves.palette === pName)} onclick={() => (waves.palette = pName)}>{pName}</button>
        {/each}
      </div>
    </div>
  </DemoCard>
  <PropsTable rows={API.waves} />
</section>

<!-- Line waves -->
<section id="line-waves" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Line waves</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A clean sinusoidal contour stack — like Waves but purely sine, each line
    phase-shifted into a travelling interference pattern. Dithered.
  </p>
  <DemoCard code={DEMO.lineWaves}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><LineWaves class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.lineWaves} />
</section>

<!-- Threads -->
<section id="threads" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Threads</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Vertical filaments drifting on an fbm flow — thin glowing threads whose x
    wanders with noise, tinted across the ramp by depth. Dithered.
  </p>
  <DemoCard code={DEMO.threads}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><Threads class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.threads} />
</section>

<!-- Silk -->
<section id="silk" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Silk</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Flowing anisotropic sheen — fbm warps a rotated sine into liquid ribbons,
    tinted across the colour ramp. No WebGL; the sheen comes out dithered.
  </p>
  <DemoCard code={DEMO.silk}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><Silk class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.silk} />
</section>

<!-- Plasma -->
<section id="plasma" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Plasma</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    The classic layered-sine plasma, mapped across the colour ramp. Ordered
    dithering bands the gradient into the kit's crunch instead of a smooth blend.
  </p>
  <DemoCard code={DEMO.plasma}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60"><Plasma class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.plasma} />
</section>

<!-- Iridescence -->
<section id="iridescence" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Iridescence</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A shifting soap-bubble sheen — fbm perturbs an HSV hue swept across the
    surface; ordered dithering bands the rainbow. Self-tinting, no colours prop.
  </p>
  <DemoCard code={DEMO.iridescence}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60"><Iridescence class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.iridescence} />
</section>

<!-- Dot grid -->
<section id="dot-grid" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Dot grid</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A lattice of round dots pulsing on fbm, brightened under the cursor — cells
    stay square via the aspect ratio, tinted across the ramp by row. Move the pointer.
  </p>
  <DemoCard code={DEMO.dotGrid}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DotGrid class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.dotGrid} />
</section>

<!-- Ripple grid -->
<section id="ripple-grid" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Ripple grid</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A lattice of dots brightened by concentric ripples expanding from the
    centre — tinted across the ramp by ring. Dithered.
  </p>
  <DemoCard code={DEMO.rippleGrid}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><RippleGrid class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.rippleGrid} />
</section>

<!-- Pixel snow -->
<section id="pixel-snow" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Pixel snow</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Sparse flakes drifting down a hashed grid — each cell hashes to a flake or
    empty, falling as time advances. Tinted across the ramp by depth, dithered.
  </p>
  <DemoCard code={DEMO.pixelSnow}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><PixelSnow class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.pixelSnow} />
</section>

<!-- Beams -->
<section id="beams" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Beams</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Parallel light beams sweeping at an angle — a rotated coordinate banded by a
    sharpened sine that scrolls over time, tinted across the ramp. Dithered.
  </p>
  <DemoCard code={DEMO.beams}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><Beams class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.beams} />
</section>

<!-- Light rays -->
<section id="light-rays" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Light rays</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    God rays fanning from a source above — the angle to the source is banded by
    a sharpened sine, jittered with fbm and faded by distance. Dithered.
  </p>
  <DemoCard code={DEMO.lightRays}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><LightRays class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.lightRays} />
</section>

<!-- Side rays -->
<section id="side-rays" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Side rays</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    The same god-ray fan, but the source sits off a side edge for horizontal
    streaks — flip <code class="text-foreground/80">side</code> to left or right.
  </p>
  <DemoCard code={DEMO.sideRays}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><SideRays class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.sideRays} />
</section>

<!-- Light pillar -->
<section id="light-pillar" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Light pillar</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Vertical light columns shimmering upward — fbm nudges the positions, a
    sharpened sine makes the pillars, brighter at the base. Dithered.
  </p>
  <DemoCard code={DEMO.lightPillar}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><LightPillar class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.lightPillar} />
</section>

<!-- Soft aurora -->
<section id="soft-aurora" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Soft aurora</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Several overlapping soft curtains accumulating into a gentle glow — wider
    falloff and a lower default dither than Aurora for a hazier look.
  </p>
  <DemoCard code={DEMO.softAurora}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><SoftAurora class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.softAurora} />
</section>

<!-- Grid motion -->
<section id="grid-motion" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Grid motion</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A scrolling line grid drifting in a direction — cells stay square via the
    aspect ratio, tinted across the ramp by depth. Dithered.
  </p>
  <DemoCard code={DEMO.gridMotion}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><GridMotion class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.gridMotion} />
</section>

<!-- Grid scan -->
<section id="grid-scan" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Grid scan</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A faint static grid with a bright bar sweeping down it, boosting gridline
    intensity as it passes. Dithered.
  </p>
  <DemoCard code={DEMO.gridScan}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><GridScan class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.gridScan} />
</section>

<!-- Grid distortion -->
<section id="grid-distortion" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Grid distortion</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A line grid warped by an fbm flow and the cursor — coordinates are displaced
    before the grid is sampled. Move the pointer to push it around.
  </p>
  <DemoCard code={DEMO.gridDistortion}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><GridDistortion class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.gridDistortion} />
</section>

<!-- Dot field -->
<section id="dot-field" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Dot field</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A lattice of dots whose radius breathes with fbm and swells under the
    cursor — tinted across the ramp by row. Move the pointer to bloom them.
  </p>
  <DemoCard code={DEMO.dotField}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><DotField class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.dotField} />
</section>

<!-- Color bends -->
<section id="color-bends" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Color bends</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Smooth colour bands undulating on an fbm warp — the ramp index is bent by
    noise so the bands ripple. Ordered dithering crunches the gradient.
  </p>
  <DemoCard code={DEMO.colorBends}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60"><ColorBends class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.colorBends} />
</section>

<!-- Gradient blinds -->
<section id="gradient-blinds" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Gradient blinds</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Angled slats each showing a colour-ramp gradient, separated by thin
    transparent gaps and sliding over time. Dithered within each slat.
  </p>
  <DemoCard code={DEMO.gradientBlinds}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><GradientBlinds class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.gradientBlinds} />
</section>

<!-- Grainient -->
<section id="grainient" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Grainient</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A directional colour gradient dusted with animated grain — per-pixel hash
    noise breaks up the ramp; ordered dithering adds the crunch on top.
  </p>
  <DemoCard code={DEMO.grainient}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60"><Grainient class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.grainient} />
</section>

<!-- Plasma wave -->
<section id="plasma-wave" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Plasma wave</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Directional plasma with wavefronts travelling along an axis — sines along
    and across the flow sum into a value mapped across the ramp. Dithered.
  </p>
  <DemoCard code={DEMO.plasmaWave}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60"><PlasmaWave class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.plasmaWave} />
</section>

<!-- Floating lines -->
<section id="floating-lines" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Floating lines</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A few thin horizontal lines bobbing and drifting independently, each with
    its own phase — tinted across the ramp by line. Dithered.
  </p>
  <DemoCard code={DEMO.floatingLines}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><FloatingLines class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.floatingLines} />
</section>

<!-- Radar -->
<section id="radar-sweep" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Radar</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A rotating sweep with an afterglow trail over concentric rings — the scope
    is circular, tinted across the ramp by radius. Dithered.
  </p>
  <DemoCard code={DEMO.radar}>
    <div class="relative mx-auto aspect-square h-64 overflow-hidden rounded-md border border-border/60 bg-black"><Radar class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.radar} />
</section>

<!-- Dither -->
<section id="dither" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Dither</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    The kit's signature at its purest — an animated fbm cloud thresholded 1-bit
    against the Bayer matrix, so the whole surface IS the ordered dither.
  </p>
  <DemoCard code={DEMO.dither}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><Dither class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.dither} />
</section>

<!-- Letter glitch -->
<section id="letter-glitch" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Letter glitch</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Matrix-style glyph rain — each column drops a bright head with a trailing
    fade; every cell holds a hashed 3x5 glyph. Tinted by brightness, dithered.
  </p>
  <DemoCard code={DEMO.letterGlitch}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><LetterGlitch class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.letterGlitch} />
</section>

<!-- Shape grid -->
<section id="shape-grid" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Shape grid</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A lattice where each cell holds a hashed shape — square, diamond, plus or
    ring — pulsing on its own phase. Tinted across the ramp, dithered.
  </p>
  <DemoCard code={DEMO.shapeGrid}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><ShapeGrid class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.shapeGrid} />
</section>

<!-- Lightning -->
<section id="lightning" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Lightning</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Jagged fbm-displaced bolts flickering in bursts — each a thin glowing line
    wandering vertically, wider toward the ground. Dithered.
  </p>
  <DemoCard code={DEMO.lightning}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><Lightning class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.lightning} />
</section>

<!-- Orb -->
<section id="orb" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Orb</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A glowing pulsing sphere with a wobbling rim — fbm perturbs the radius for
    a plasma edge; a core glow plus a rim ring tint across the ramp by radius.
  </p>
  <DemoCard code={DEMO.orb}>
    <div class="relative mx-auto aspect-square h-64 overflow-hidden rounded-md border border-border/60 bg-black"><Orb class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.orb} />
</section>

<!-- Prism -->
<section id="prism" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Prism</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A spectral light fan dispersing from above — the angle across the fan maps
    to an HSV hue, so the beam splits into a rainbow. Self-colouring, dithered.
  </p>
  <DemoCard code={DEMO.prism}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><Prism class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.prism} />
</section>

<!-- Galaxy -->
<section id="galaxy" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Galaxy</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A rotating spiral of twinkling stars with a bright core — spiral arms
    modulate a hashed star density; inner stars rotate faster. Dithered.
  </p>
  <DemoCard code={DEMO.galaxy}>
    <div class="relative mx-auto aspect-square h-64 overflow-hidden rounded-md border border-border/60 bg-black"><Galaxy class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.galaxy} />
</section>

<!-- Liquid chrome -->
<section id="liquid-chrome" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Liquid chrome</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Molten metal — iterative domain warping folds the coordinates into rippled
    reflective bands; a high-contrast sine reads them as chrome. Dithered.
  </p>
  <DemoCard code={DEMO.liquidChrome}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60"><LiquidChrome class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.liquidChrome} />
</section>

<!-- Dark veil -->
<section id="dark-veil" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Dark veil</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A moody near-black wash with faint colour wisps and an edge vignette —
    sparse fbm highlights climb the ramp; dithering crunches the low light.
  </p>
  <DemoCard code={DEMO.darkVeil}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60"><DarkVeil class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.darkVeil} />
</section>

<!-- Balatro -->
<section id="balatro" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Balatro</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A swirling psychedelic paint vortex — polar coordinates twisted by a
    radius-dependent spin, then layered sines paint the swirl. Dithered.
  </p>
  <DemoCard code={DEMO.balatro}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60"><Balatro class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.balatro} />
</section>

<!-- Liquid ether -->
<section id="liquid-ether" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Liquid ether</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    An ethereal flowing colour fluid — coordinates are advected by an fbm flow
    and stirred by the cursor before sampling the ramp. Move the pointer.
  </p>
  <DemoCard code={DEMO.liquidEther}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60"><LiquidEther class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.liquidEther} />
</section>

<!-- Ballpit -->
<section id="ballpit" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Ballpit</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A pit of shaded spheres bobbing on a grid — sphere shading gives depth, and
    the balls repel from the cursor. Move the pointer to part them.
  </p>
  <DemoCard code={DEMO.ballpit}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><Ballpit class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.ballpit} />
</section>

<!-- Particles -->
<section id="particles" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Particles</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A drifting, twinkling point cloud — each particle wanders on a sine orbit
    and drifts toward the cursor. Move the pointer to gather them.
  </p>
  <DemoCard code={DEMO.particles}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><Particles class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.particles} />
</section>

<!-- Hyperspeed -->
<section id="hyperspeed" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Hyperspeed</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A warp-drive starfield streaking radially from the centre — angular lanes
    carry hashed star heads rushing outward with trailing tails. Dithered.
  </p>
  <DemoCard code={DEMO.hyperspeed}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><Hyperspeed class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.hyperspeed} />
</section>

<!-- Lightfall -->
<section id="lightfall" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Lightfall</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Soft columns of light drifting downward with long fading trails — each
    column drops a hashed head; the trail fades upward. Dithered.
  </p>
  <DemoCard code={DEMO.lightfall}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><Lightfall class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.lightfall} />
</section>

<!-- Pixel blast -->
<section id="pixel-blast" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Pixel blast</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Expanding shockwave rings broken into chunky pixels — several rings pulse
    outward from the centre and fade; a coarse hash grid pixelates them.
  </p>
  <DemoCard code={DEMO.pixelBlast}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><PixelBlast class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.pixelBlast} />
</section>

<!-- Prismatic burst -->
<section id="prismatic-burst" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Prismatic burst</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A rainbow starburst radiating from the centre — sharpened angular rays take
    an HSV hue from angle and radius, so the burst is a spectrum. Self-colouring.
  </p>
  <DemoCard code={DEMO.prismaticBurst}>
    <div class="relative mx-auto aspect-square h-64 overflow-hidden rounded-md border border-border/60 bg-black"><PrismaticBurst class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.prismaticBurst} />
</section>

<!-- Evil eye -->
<section id="evil-eye" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Evil eye</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A glowing eye whose iris tracks the cursor and that blinks — a lens mask
    carves the eye; iris rings pulse around a dark pupil. Move the pointer.
  </p>
  <DemoCard code={DEMO.evilEye}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black"><EvilEye class="absolute inset-0" /></div>
  </DemoCard>
  <PropsTable rows={API.evilEye} />
</section>

<!-- Faulty terminal -->
<section id="faulty-terminal" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Faulty terminal</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A CRT glyph wall — animated value-noise lights a grid of characters, then
    scanlines, glitch, flicker, chromatic aberration and barrel curvature run
    over it. No WebGL: it draws through the same Bayer engine as everything
    else, so <code class="text-foreground/80">dither</code> is just an
    intensity from smooth to hard 1-bit. Fills its box; move the pointer over it.
  </p>
  <DemoCard code={termCode}>
    <div class="relative h-56 overflow-hidden rounded-md border border-border/60">
      <FaultyTerminal
        tint={term.tint}
        scale={termParams.scale}
        glitchAmount={termParams.glitchAmount}
        scanlineIntensity={termParams.scanlineIntensity}
        dither={termParams.dither}
        curvature={termParams.curvature}
        chromaticAberration={termParams.chromaticAberration}
        class="absolute inset-0"
      />
    </div>
    <div class="mt-5 flex flex-wrap items-center justify-center gap-4">
      <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
        {#each TERM_PRESET_NAMES as pName (pName)}
          <button type="button" aria-pressed={term.preset === pName} class={chipClass(term.preset === pName)} onclick={() => (term.preset = pName)}>{pName}</button>
        {/each}
      </div>
      <div class="flex items-center gap-2">
        {#each COLORS as c (c)}
          <button
            type="button"
            aria-label={`Tint ${c}`}
            aria-pressed={term.tint === c}
            class="size-6 rounded-[4px] transition-transform {term.tint === c ? 'ring-1 ring-foreground ring-offset-2 ring-offset-background' : 'hover:scale-110'}"
            style:background-color={cssColor(c)}
            onclick={() => (term.tint = c)}
          ></button>
        {/each}
      </div>
    </div>
  </DemoCard>
  <PropsTable rows={API.faultyTerminal} />
</section>

<!-- Ferrofluid -->
<section id="ferrofluid" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Ferrofluid</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Two fluid layers merge into metaball blobs; their contour rim glows,
    tinted across the array of colors by height. Turbulence swirls the domain,
    shimmer grains the lines, and the pointer raises a magnetic spike. No
    WebGL — it draws through the same Bayer engine, so the rim comes out
    crunchy. Fills its box.
  </p>
  <DemoCard code={fluidCode}>
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60">
      <Ferrofluid colors={fluidColors} flowDirection={fluid.flow} class="absolute inset-0" />
    </div>
    <div class="mt-5 flex flex-wrap items-center justify-center gap-4">
      <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
        {#each FLUID_PALETTE_NAMES as pName (pName)}
          <button type="button" aria-pressed={fluid.palette === pName} class={chipClass(fluid.palette === pName)} onclick={() => (fluid.palette = pName)}>{pName}</button>
        {/each}
      </div>
      <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
        {#each FLOW_DIRS as dir (dir)}
          <button type="button" aria-pressed={fluid.flow === dir} class={chipClass(fluid.flow === dir)} onclick={() => (fluid.flow = dir)}>{dir}</button>
        {/each}
      </div>
    </div>
  </DemoCard>
  <PropsTable rows={API.ferrofluid} />
</section>
