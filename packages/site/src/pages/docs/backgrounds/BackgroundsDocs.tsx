import { createMemo, For } from "solid-js"
import { createStore } from "solid-js/store"
import {
  cssColor,
  DitherAurora,
  DitherBalatro,
  DitherBallpit,
  DitherBeams,
  DitherButton,
  DitherCircuit,
  DitherHeatTrail,
  DitherColorBends,
  DitherEvilEye,
  DitherHyperspeed,
  DitherLightfall,
  DitherLiquidEther,
  DitherParticles,
  DitherPixelBlast,
  DitherPrismaticBurst,
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
  DitherFlowField,
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
} from "@dither-ui/kit"
import DemoCard, { DEMO_FIT } from "../DemoCard"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import circuitProps from "virtual:dither-props/DitherCircuit"
import heatTrailProps from "virtual:dither-props/DitherHeatTrail"
import auroraProps from "virtual:dither-props/DitherAurora"
import wavesProps from "virtual:dither-props/DitherWaves"
import lineWavesProps from "virtual:dither-props/DitherLineWaves"
import threadsProps from "virtual:dither-props/DitherThreads"
import silkProps from "virtual:dither-props/DitherSilk"
import plasmaProps from "virtual:dither-props/DitherPlasma"
import iridescenceProps from "virtual:dither-props/DitherIridescence"
import dotGridProps from "virtual:dither-props/DitherDotGrid"
import rippleGridProps from "virtual:dither-props/DitherRippleGrid"
import pixelSnowProps from "virtual:dither-props/DitherPixelSnow"
import beamsProps from "virtual:dither-props/DitherBeams"
import lightRaysProps from "virtual:dither-props/DitherLightRays"
import sideRaysProps from "virtual:dither-props/DitherSideRays"
import lightPillarProps from "virtual:dither-props/DitherLightPillar"
import softAuroraProps from "virtual:dither-props/DitherSoftAurora"
import gridMotionProps from "virtual:dither-props/DitherGridMotion"
import gridScanProps from "virtual:dither-props/DitherGridScan"
import gridDistortionProps from "virtual:dither-props/DitherGridDistortion"
import dotFieldProps from "virtual:dither-props/DitherDotField"
import colorBendsProps from "virtual:dither-props/DitherColorBends"
import gradientBlindsProps from "virtual:dither-props/DitherGradientBlinds"
import grainientProps from "virtual:dither-props/DitherGrainient"
import plasmaWaveProps from "virtual:dither-props/DitherPlasmaWave"
import floatingLinesProps from "virtual:dither-props/DitherFloatingLines"
import flowFieldProps from "virtual:dither-props/DitherFlowField"
import radarProps from "virtual:dither-props/DitherRadar"
import ditherProps from "virtual:dither-props/DitherDither"
import letterGlitchProps from "virtual:dither-props/DitherLetterGlitch"
import shapeGridProps from "virtual:dither-props/DitherShapeGrid"
import lightningProps from "virtual:dither-props/DitherLightning"
import orbProps from "virtual:dither-props/DitherOrb"
import prismProps from "virtual:dither-props/DitherPrism"
import galaxyProps from "virtual:dither-props/DitherGalaxy"
import liquidChromeProps from "virtual:dither-props/DitherLiquidChrome"
import darkVeilProps from "virtual:dither-props/DitherDarkVeil"
import balatroProps from "virtual:dither-props/DitherBalatro"
import liquidEtherProps from "virtual:dither-props/DitherLiquidEther"
import ballpitProps from "virtual:dither-props/DitherBallpit"
import particlesProps from "virtual:dither-props/DitherParticles"
import hyperspeedProps from "virtual:dither-props/DitherHyperspeed"
import lightfallProps from "virtual:dither-props/DitherLightfall"
import pixelBlastProps from "virtual:dither-props/DitherPixelBlast"
import prismaticBurstProps from "virtual:dither-props/DitherPrismaticBurst"
import evilEyeProps from "virtual:dither-props/DitherEvilEye"
import faultyTerminalProps from "virtual:dither-props/DitherFaultyTerminal"
import ferrofluidProps from "virtual:dither-props/DitherFerrofluid"
import DocSection from "../DocSection"
import PosterSection from "./PosterSection"

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

// Circuit playground: how much of the board carries traces, and a new
// board from a new seed; the code tab mirrors both.
const CIRCUIT_DENSITIES = { sparse: 0.35, even: 0.6, dense: 0.9 } as const
type CircuitDensity = keyof typeof CIRCUIT_DENSITIES
const CIRCUIT_DENSITY_NAMES = Object.keys(CIRCUIT_DENSITIES) as CircuitDensity[]

// Heat trail playground: how long a cell takes to cool and how big the
// diamond the pointer prints; the code tab mirrors both.
const TRAIL_COOLS = { quick: 0.8, even: 1.6, slow: 3 } as const
type TrailCool = keyof typeof TRAIL_COOLS
const TRAIL_COOL_NAMES = Object.keys(TRAIL_COOLS) as TrailCool[]
const TRAIL_SIZES = { fine: 2, even: 3, bold: 5 } as const
type TrailSize = keyof typeof TRAIL_SIZES
const TRAIL_SIZE_NAMES = Object.keys(TRAIL_SIZES) as TrailSize[]

// Waves playground — a colour ramp preset; the code tab mirrors it.
const WAVES_PALETTES = {
  aurora: ["#5227FF", "#7CFF67"],
  ocean: ["#3DA5FF", "#7CE0FF"],
  sunset: ["#FF3D2E", "#FFD23D"],
} as const
type WavesPalette = keyof typeof WAVES_PALETTES
const WAVES_PALETTE_NAMES = Object.keys(WAVES_PALETTES) as WavesPalette[]

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

const wrap = (tag: string) => `<div class="relative h-64 overflow-hidden rounded-md">\n  ${tag}\n</div>`
const DEMO = {
  lineWaves: wrap("<DitherLineWaves />"),
  threads: wrap("<DitherThreads />"),
  silk: wrap("<DitherSilk />"),
  plasma: wrap("<DitherPlasma />"),
  iridescence: wrap("<DitherIridescence />"),
  dotGrid: wrap("<DitherDotGrid />"),
  rippleGrid: wrap("<DitherRippleGrid />"),
  pixelSnow: wrap("<DitherPixelSnow />"),
  beams: wrap("<DitherBeams />"),
  lightRays: wrap("<DitherLightRays />"),
  sideRays: wrap("<DitherSideRays />"),
  lightPillar: wrap("<DitherLightPillar />"),
  softAurora: wrap("<DitherSoftAurora />"),
  gridMotion: wrap("<DitherGridMotion />"),
  gridScan: wrap("<DitherGridScan />"),
  gridDistortion: wrap("<DitherGridDistortion />"),
  dotField: wrap("<DitherDotField />"),
  colorBends: wrap("<DitherColorBends />"),
  gradientBlinds: wrap("<DitherGradientBlinds />"),
  grainient: wrap("<DitherGrainient />"),
  plasmaWave: wrap("<DitherPlasmaWave />"),
  floatingLines: wrap("<DitherFloatingLines />"),
  flowField: wrap("<DitherFlowField />"),
  radar: wrap("<DitherRadar />"),
  dither: wrap("<DitherDither />"),
  letterGlitch: wrap("<DitherLetterGlitch />"),
  shapeGrid: wrap("<DitherShapeGrid />"),
  lightning: wrap("<DitherLightning />"),
  orb: wrap("<DitherOrb />"),
  prism: wrap("<DitherPrism />"),
  galaxy: wrap("<DitherGalaxy />"),
  liquidChrome: wrap("<DitherLiquidChrome />"),
  darkVeil: wrap("<DitherDarkVeil />"),
  balatro: wrap("<DitherBalatro />"),
  liquidEther: wrap("<DitherLiquidEther />"),
  ballpit: wrap("<DitherBallpit />"),
  particles: wrap("<DitherParticles />"),
  hyperspeed: wrap("<DitherHyperspeed />"),
  lightfall: wrap("<DitherLightfall />"),
  pixelBlast: wrap("<DitherPixelBlast />"),
  prismaticBurst: wrap("<DitherPrismaticBurst />"),
  evilEye: wrap("<DitherEvilEye />"),
}

export const API: Record<string, PropRow[]> = {
  circuit: kitTable(circuitProps),
  "heat-trail": kitTable(heatTrailProps),
  aurora: kitTable(auroraProps),
  waves: kitTable(wavesProps),
  lineWaves: kitTable(lineWavesProps),
  threads: kitTable(threadsProps),
  silk: kitTable(silkProps),
  plasma: kitTable(plasmaProps),
  iridescence: kitTable(iridescenceProps),
  dotGrid: kitTable(dotGridProps),
  rippleGrid: kitTable(rippleGridProps),
  pixelSnow: kitTable(pixelSnowProps),
  beams: kitTable(beamsProps),
  lightRays: kitTable(lightRaysProps),
  sideRays: kitTable(sideRaysProps),
  lightPillar: kitTable(lightPillarProps),
  softAurora: kitTable(softAuroraProps),
  gridMotion: kitTable(gridMotionProps),
  gridScan: kitTable(gridScanProps),
  gridDistortion: kitTable(gridDistortionProps),
  dotField: kitTable(dotFieldProps),
  colorBends: kitTable(colorBendsProps),
  gradientBlinds: kitTable(gradientBlindsProps),
  grainient: kitTable(grainientProps),
  plasmaWave: kitTable(plasmaWaveProps),
  floatingLines: kitTable(floatingLinesProps),
  flowField: kitTable(flowFieldProps),
  radar: kitTable(radarProps),
  dither: kitTable(ditherProps),
  letterGlitch: kitTable(letterGlitchProps),
  shapeGrid: kitTable(shapeGridProps),
  lightning: kitTable(lightningProps),
  orb: kitTable(orbProps),
  prism: kitTable(prismProps),
  galaxy: kitTable(galaxyProps),
  liquidChrome: kitTable(liquidChromeProps),
  darkVeil: kitTable(darkVeilProps),
  balatro: kitTable(balatroProps),
  liquidEther: kitTable(liquidEtherProps),
  ballpit: kitTable(ballpitProps),
  particles: kitTable(particlesProps),
  hyperspeed: kitTable(hyperspeedProps),
  lightfall: kitTable(lightfallProps),
  pixelBlast: kitTable(pixelBlastProps),
  prismaticBurst: kitTable(prismaticBurstProps),
  evilEye: kitTable(evilEyeProps),
  faultyTerminal: kitTable(faultyTerminalProps),
  ferrofluid: kitTable(ferrofluidProps),
}

export default function BackgroundsDocs() {
  const [aurora, setAurora] = createStore({ palette: "polar" as AuroraPalette })
  const auroraColors = createMemo(() => [...AURORA_PALETTES[aurora.palette]])
  const auroraCode = createMemo(
    () =>
      `<div class="relative h-64 overflow-hidden rounded-md">
  <DitherAurora colors={${JSON.stringify(auroraColors())}} />
</div>`,
  )
  const [circuit, setCircuit] = createStore({ density: "even" as CircuitDensity, seed: 7 })
  const circuitCode = createMemo(
    () =>
      `<div class="relative h-64 overflow-hidden rounded-md">
  <DitherCircuit density={${CIRCUIT_DENSITIES[circuit.density]}} seed={${circuit.seed}} />
</div>`,
  )
  const [trail, setTrail] = createStore({ cool: "even" as TrailCool, size: "even" as TrailSize })
  const trailCode = createMemo(
    () =>
      `<div class="relative h-64 overflow-hidden rounded-md">
  <DitherHeatTrail class="absolute inset-0" cool={${TRAIL_COOLS[trail.cool]}} size={${TRAIL_SIZES[trail.size]}} />
</div>`,
  )
  const [waves, setWaves] = createStore({ palette: "aurora" as WavesPalette })
  const wavesColors = createMemo(() => [...WAVES_PALETTES[waves.palette]])
  const wavesCode = createMemo(
    () =>
      `<div class="relative h-64 overflow-hidden rounded-md">
  <DitherWaves colors={${JSON.stringify(wavesColors())}} />
</div>`,
  )
  const [term, setTerm] = createStore({ tint: "green" as DitherColor, preset: "signal" as TermPreset })
  const termParams = createMemo(() => TERM_PRESETS[term.preset])
  const termCode = createMemo(() => {
    const p = termParams()
    const attrs = [
      `tint="${term.tint}"`,
      `scale={${p.scale}}`,
      `glitchAmount={${p.glitchAmount}}`,
      `scanlineIntensity={${p.scanlineIntensity}}`,
    ]
    if (p.dither) attrs.push(`dither={${p.dither}}`)
    if (p.curvature) attrs.push(`curvature={${p.curvature}}`)
    if (p.chromaticAberration) attrs.push(`chromaticAberration={${p.chromaticAberration}}`)
    return `<div class="relative h-56 overflow-hidden rounded-md">\n  <DitherFaultyTerminal ${attrs.join(" ")} />\n</div>`
  })
  const [fluid, setFluid] = createStore({ palette: "acid" as FluidPalette, flow: "down" as FlowDirection })
  const fluidColors = createMemo(() => [...FLUID_PALETTES[fluid.palette]])
  const fluidCode = createMemo(
    () =>
      `<div class="relative h-64 overflow-hidden rounded-md">
  <DitherFerrofluid colors={${JSON.stringify(fluidColors())}} flowDirection="${fluid.flow}" />
</div>`,
  )

  // Every background is a surface: its demo bleeds to the well's edges (the
  // square ones opt back in to the inset).
  return (
    <DEMO_FIT.Provider value="bleed">
      {/* Aurora */}
      <DocSection id="aurora">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Glowing polar curtains: a wavy light band hangs near the top, broken into vertical rays and tinted across the
          colour ramp by width. No WebGL: it draws through the same Bayer engine, so the glow comes out dithered. Fills
          its box.
        </p>
        <DemoCard code={auroraCode()}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherAurora colors={auroraColors()} />
          </div>
          <div class="mt-5 flex flex-wrap items-center justify-center gap-4">
            <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
              <For each={AURORA_PALETTE_NAMES}>
                {(pName) => (
                  <button
                    type="button"
                    aria-pressed={aurora.palette === pName}
                    class={chipClass(aurora.palette === pName)}
                    onClick={() => setAurora("palette", pName)}
                  >
                    {pName}
                  </button>
                )}
              </For>
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.aurora} />
      </DocSection>

      {/* Circuit */}
      <DocSection id="circuit">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A board printed through the dither: chips on a lattice, traces leaving their pins in straight runs with 45
          degree jogs to a via or a pad, and a signal running every trace with a tail that fades through the thresholds.
          The seed lays the board out and the signals follow the clock, so a moment prints the same however you reach
          it.
        </p>
        <DemoCard code={circuitCode()}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherCircuit density={CIRCUIT_DENSITIES[circuit.density]} seed={circuit.seed} />
          </div>
          <div class="mt-5 flex flex-wrap items-center justify-center gap-4">
            <div
              role="group"
              aria-label="Density"
              class="flex items-center gap-1 rounded-md border border-border/60 p-1"
            >
              <For each={CIRCUIT_DENSITY_NAMES}>
                {(d) => (
                  <button
                    type="button"
                    aria-pressed={circuit.density === d}
                    class={chipClass(circuit.density === d)}
                    onClick={() => setCircuit("density", d)}
                  >
                    {d}
                  </button>
                )}
              </For>
            </div>
            <DitherButton
              variant="solid"
              color="grey"
              onClick={() => setCircuit("seed", (circuit.seed * 7 + 13) % 997)}
            >
              New board
            </DitherButton>
          </div>
        </DemoCard>
        <PropsTable rows={API.circuit} />
      </DocSection>

      {/* Heat trail */}
      <DocSection id="heat-trail">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The pointer prints. Where a mouse or a pen passes, the kit's diamond lands in cells, hot, along the whole path
          however fast the hand moves; each cell then cools down the ramp and thins out through the dither thresholds
          until the ground is still again. It listens on the window, so text and keys over it never block the hand. A
          finger scrolls instead, nothing prints under reduced motion, and it paints only while something is cooling.
        </p>
        <DemoCard code={trailCode()}>
          {/* a black stage in both themes: its words take the dark theme's inks */}
          <div class="dark relative grid h-64 place-items-center overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherHeatTrail class="absolute inset-0" cool={TRAIL_COOLS[trail.cool]} size={TRAIL_SIZES[trail.size]} />
            <p class="relative text-[13px] text-muted-foreground">Move a mouse or a pen across here</p>
          </div>
          <div class="mt-5 flex flex-wrap items-center justify-center gap-4">
            <div
              role="group"
              aria-label="Cooling"
              class="flex items-center gap-1 rounded-md border border-border/60 p-1"
            >
              <For each={TRAIL_COOL_NAMES}>
                {(c) => (
                  <button
                    type="button"
                    aria-pressed={trail.cool === c}
                    class={chipClass(trail.cool === c)}
                    onClick={() => setTrail("cool", c)}
                  >
                    {c}
                  </button>
                )}
              </For>
            </div>
            <div role="group" aria-label="Size" class="flex items-center gap-1 rounded-md border border-border/60 p-1">
              <For each={TRAIL_SIZE_NAMES}>
                {(z) => (
                  <button
                    type="button"
                    aria-pressed={trail.size === z}
                    class={chipClass(trail.size === z)}
                    onClick={() => setTrail("size", z)}
                  >
                    {z}
                  </button>
                )}
              </For>
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API["heat-trail"]} />
      </DocSection>

      {/* Waves */}
      <DocSection id="waves">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A stack of horizontal contour lines flowing on an fbm field, each a thin glowing band that ripples with noise,
          tinted across the colour ramp by depth. Move the pointer to bend the nearest lines toward it. No WebGL: it
          draws through the same Bayer engine, so the lines come out dithered.
        </p>
        <DemoCard code={wavesCode()}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherWaves colors={wavesColors()} />
          </div>
          <div class="mt-5 flex flex-wrap items-center justify-center gap-4">
            <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
              <For each={WAVES_PALETTE_NAMES}>
                {(pName) => (
                  <button
                    type="button"
                    aria-pressed={waves.palette === pName}
                    class={chipClass(waves.palette === pName)}
                    onClick={() => setWaves("palette", pName)}
                  >
                    {pName}
                  </button>
                )}
              </For>
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.waves} />
      </DocSection>

      {/* Line waves */}
      <DocSection id="line-waves">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A clean sinusoidal contour stack: like Waves but purely sine, each line phase-shifted into a travelling
          interference pattern. Dithered.
        </p>
        <DemoCard code={DEMO.lineWaves}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherLineWaves />
          </div>
        </DemoCard>
        <PropsTable rows={API.lineWaves} />
      </DocSection>

      {/* Threads */}
      <DocSection id="threads">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Vertical filaments drifting on an fbm flow: thin glowing threads whose x wanders with noise, tinted across the
          ramp by depth. Dithered.
        </p>
        <DemoCard code={DEMO.threads}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherThreads />
          </div>
        </DemoCard>
        <PropsTable rows={API.threads} />
      </DocSection>

      {/* Silk */}
      <DocSection id="silk">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Flowing anisotropic sheen: fbm warps a rotated sine into liquid ribbons, tinted across the colour ramp. No
          WebGL; the sheen comes out dithered.
        </p>
        <DemoCard code={DEMO.silk}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherSilk />
          </div>
        </DemoCard>
        <PropsTable rows={API.silk} />
      </DocSection>

      {/* Plasma */}
      <DocSection id="plasma">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The classic layered-sine plasma, mapped across the colour ramp. Ordered dithering bands the gradient into the
          kit's crunch instead of a smooth blend.
        </p>
        <DemoCard code={DEMO.plasma}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60">
            <DitherPlasma />
          </div>
        </DemoCard>
        <PropsTable rows={API.plasma} />
      </DocSection>

      {/* Iridescence */}
      <DocSection id="iridescence">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A shifting soap-bubble sheen: fbm perturbs an HSV hue swept across the surface; ordered dithering bands the
          rainbow. Self-tinting, no colours prop.
        </p>
        <DemoCard code={DEMO.iridescence}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60">
            <DitherIridescence />
          </div>
        </DemoCard>
        <PropsTable rows={API.iridescence} />
      </DocSection>

      {/* Dot grid */}
      <DocSection id="dot-grid">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A lattice of round dots pulsing on fbm, brightened under the cursor. Cells stay square via the aspect ratio,
          tinted across the ramp by row. Move the pointer.
        </p>
        <DemoCard code={DEMO.dotGrid}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherDotGrid />
          </div>
        </DemoCard>
        <PropsTable rows={API.dotGrid} />
      </DocSection>

      {/* Ripple grid */}
      <DocSection id="ripple-grid">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A lattice of dots brightened by concentric ripples expanding from the centre, tinted across the ramp by ring.
          Dithered.
        </p>
        <DemoCard code={DEMO.rippleGrid}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherRippleGrid />
          </div>
        </DemoCard>
        <PropsTable rows={API.rippleGrid} />
      </DocSection>

      {/* Pixel snow */}
      <DocSection id="pixel-snow">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Sparse flakes drifting down a hashed grid: each cell hashes to a flake or empty, falling as time advances.
          Tinted across the ramp by depth, dithered.
        </p>
        <DemoCard code={DEMO.pixelSnow}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherPixelSnow />
          </div>
        </DemoCard>
        <PropsTable rows={API.pixelSnow} />
      </DocSection>

      {/* Beams */}
      <DocSection id="beams">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Parallel light beams sweeping at an angle: a rotated coordinate banded by a sharpened sine that scrolls over
          time, tinted across the ramp. Dithered.
        </p>
        <DemoCard code={DEMO.beams}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherBeams />
          </div>
        </DemoCard>
        <PropsTable rows={API.beams} />
      </DocSection>

      {/* Light rays */}
      <DocSection id="light-rays">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          God rays fanning from a source above: the angle to the source is banded by a sharpened sine, jittered with fbm
          and faded by distance. Dithered.
        </p>
        <DemoCard code={DEMO.lightRays}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherLightRays />
          </div>
        </DemoCard>
        <PropsTable rows={API.lightRays} />
      </DocSection>

      {/* Side rays */}
      <DocSection id="side-rays">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The same god-ray fan, but the source sits off a side edge for horizontal streaks. Flip{" "}
          <code class="text-foreground/80">side</code> to left or right.
        </p>
        <DemoCard code={DEMO.sideRays}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherSideRays />
          </div>
        </DemoCard>
        <PropsTable rows={API.sideRays} />
      </DocSection>

      {/* Light pillar */}
      <DocSection id="light-pillar">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Vertical light columns shimmering upward: fbm nudges the positions, a sharpened sine makes the pillars,
          brighter at the base. Dithered.
        </p>
        <DemoCard code={DEMO.lightPillar}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherLightPillar />
          </div>
        </DemoCard>
        <PropsTable rows={API.lightPillar} />
      </DocSection>

      {/* Soft aurora */}
      <DocSection id="soft-aurora">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Several overlapping soft curtains accumulating into a gentle glow: wider falloff and a lower default dither
          than Aurora for a hazier look.
        </p>
        <DemoCard code={DEMO.softAurora}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherSoftAurora />
          </div>
        </DemoCard>
        <PropsTable rows={API.softAurora} />
      </DocSection>

      {/* Grid motion */}
      <DocSection id="grid-motion">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A scrolling line grid drifting in a direction. Cells stay square via the aspect ratio, tinted across the ramp
          by depth. Dithered.
        </p>
        <DemoCard code={DEMO.gridMotion}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherGridMotion />
          </div>
        </DemoCard>
        <PropsTable rows={API.gridMotion} />
      </DocSection>

      {/* Grid scan */}
      <DocSection id="grid-scan">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A faint static grid with a bright bar sweeping down it, boosting gridline intensity as it passes. Dithered.
        </p>
        <DemoCard code={DEMO.gridScan}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherGridScan />
          </div>
        </DemoCard>
        <PropsTable rows={API.gridScan} />
      </DocSection>

      {/* Grid distortion */}
      <DocSection id="grid-distortion">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A line grid warped by an fbm flow and the cursor: coordinates are displaced before the grid is sampled. Move
          the pointer to push it around.
        </p>
        <DemoCard code={DEMO.gridDistortion}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherGridDistortion />
          </div>
        </DemoCard>
        <PropsTable rows={API.gridDistortion} />
      </DocSection>

      {/* Dot field */}
      <DocSection id="dot-field">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A lattice of dots whose radius breathes with fbm and swells under the cursor, tinted across the ramp by row.
          Move the pointer to bloom them.
        </p>
        <DemoCard code={DEMO.dotField}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherDotField />
          </div>
        </DemoCard>
        <PropsTable rows={API.dotField} />
      </DocSection>

      {/* Color bends */}
      <DocSection id="color-bends">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Smooth colour bands undulating on an fbm warp: the ramp index is bent by noise so the bands ripple. Ordered
          dithering crunches the gradient.
        </p>
        <DemoCard code={DEMO.colorBends}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60">
            <DitherColorBends />
          </div>
        </DemoCard>
        <PropsTable rows={API.colorBends} />
      </DocSection>

      {/* Gradient blinds */}
      <DocSection id="gradient-blinds">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Angled slats each showing a colour-ramp gradient, separated by thin transparent gaps and sliding over time.
          Dithered within each slat.
        </p>
        <DemoCard code={DEMO.gradientBlinds}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherGradientBlinds />
          </div>
        </DemoCard>
        <PropsTable rows={API.gradientBlinds} />
      </DocSection>

      {/* Grainient */}
      <DocSection id="grainient">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A directional colour gradient dusted with animated grain: per-pixel hash noise breaks up the ramp; ordered
          dithering adds the crunch on top.
        </p>
        <DemoCard code={DEMO.grainient}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60">
            <DitherGrainient />
          </div>
        </DemoCard>
        <PropsTable rows={API.grainient} />
      </DocSection>

      {/* Plasma wave */}
      <DocSection id="plasma-wave">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Directional plasma with wavefronts travelling along an axis: sines along and across the flow sum into a value
          mapped across the ramp. Dithered.
        </p>
        <DemoCard code={DEMO.plasmaWave}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60">
            <DitherPlasmaWave />
          </div>
        </DemoCard>
        <PropsTable rows={API.plasmaWave} />
      </DocSection>

      {/* Floating lines */}
      <DocSection id="floating-lines">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A few thin horizontal lines bobbing and drifting independently, each with its own phase. Tinted across the
          ramp by line. Dithered.
        </p>
        <DemoCard code={DEMO.floatingLines}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherFloatingLines />
          </div>
        </DemoCard>
        <PropsTable rows={API.floatingLines} />
      </DocSection>

      {/* Flow field */}
      <DocSection id="flow-field">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Thousands of tiny dots advected through seeded simplex wind. Each one samples the noise angle at its own
          position and drifts down-current while the buffer's ink decays beneath it: the trail is the buffer's own
          decay, so the streaks read as wind or water without stored geometry. Edge-masked by default; deterministic per
          seed.
        </p>
        <DemoCard code={DEMO.flowField}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherFlowField />
          </div>
        </DemoCard>
        <PropsTable rows={API.flowField} />
      </DocSection>

      {/* Radar */}
      <DocSection id="radar-sweep">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A rotating sweep with an afterglow trail over concentric rings. The scope is circular, tinted across the ramp
          by radius. Dithered.
        </p>
        <DemoCard fit="inset" code={DEMO.radar}>
          <div class="relative mx-auto aspect-square h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherRadar />
          </div>
        </DemoCard>
        <PropsTable rows={API.radar} />
      </DocSection>

      {/* Dither */}
      <DocSection id="dither">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The kit's signature at its purest: an animated fbm cloud thresholded 1-bit against the Bayer matrix, so the
          whole surface IS the ordered dither.
        </p>
        <DemoCard code={DEMO.dither}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherDither />
          </div>
        </DemoCard>
        <PropsTable rows={API.dither} />
      </DocSection>

      {/* Letter glitch */}
      <DocSection id="letter-glitch">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Matrix-style glyph rain: each column drops a bright head with a trailing fade; every cell holds a hashed 3x5
          glyph. Tinted by brightness, dithered.
        </p>
        <DemoCard code={DEMO.letterGlitch}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherLetterGlitch />
          </div>
        </DemoCard>
        <PropsTable rows={API.letterGlitch} />
      </DocSection>

      {/* Shape grid */}
      <DocSection id="shape-grid">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A lattice where each cell holds a hashed shape (square, diamond, plus or ring) pulsing on its own phase.
          Tinted across the ramp, dithered.
        </p>
        <DemoCard code={DEMO.shapeGrid}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherShapeGrid />
          </div>
        </DemoCard>
        <PropsTable rows={API.shapeGrid} />
      </DocSection>

      {/* Lightning */}
      <DocSection id="lightning">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Jagged fbm-displaced bolts flickering in bursts, each a thin glowing line wandering vertically, wider toward
          the ground. Dithered.
        </p>
        <DemoCard code={DEMO.lightning}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherLightning />
          </div>
        </DemoCard>
        <PropsTable rows={API.lightning} />
      </DocSection>

      {/* Orb */}
      <DocSection id="orb">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A glowing pulsing sphere with a wobbling rim: fbm perturbs the radius for a plasma edge; a core glow plus a
          rim ring tint across the ramp by radius.
        </p>
        <DemoCard fit="inset" code={DEMO.orb}>
          <div class="relative mx-auto aspect-square h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherOrb />
          </div>
        </DemoCard>
        <PropsTable rows={API.orb} />
      </DocSection>

      {/* Prism */}
      <DocSection id="prism">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A spectral light fan dispersing from above: the angle across the fan maps to an HSV hue, so the beam splits
          into a rainbow. Self-colouring, dithered.
        </p>
        <DemoCard code={DEMO.prism}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherPrism />
          </div>
        </DemoCard>
        <PropsTable rows={API.prism} />
      </DocSection>

      {/* Galaxy */}
      <DocSection id="galaxy">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A rotating spiral of twinkling stars with a bright core: spiral arms modulate a hashed star density; inner
          stars rotate faster. Dithered.
        </p>
        <DemoCard fit="inset" code={DEMO.galaxy}>
          <div class="relative mx-auto aspect-square h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherGalaxy />
          </div>
        </DemoCard>
        <PropsTable rows={API.galaxy} />
      </DocSection>

      {/* Liquid chrome */}
      <DocSection id="liquid-chrome">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Molten metal: iterative domain warping folds the coordinates into rippled reflective bands; a high-contrast
          sine reads them as chrome. Dithered.
        </p>
        <DemoCard code={DEMO.liquidChrome}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60">
            <DitherLiquidChrome />
          </div>
        </DemoCard>
        <PropsTable rows={API.liquidChrome} />
      </DocSection>

      {/* Dark veil */}
      <DocSection id="dark-veil">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A moody near-black wash with faint colour wisps and an edge vignette: sparse fbm highlights climb the ramp;
          dithering crunches the low light.
        </p>
        <DemoCard code={DEMO.darkVeil}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60">
            <DitherDarkVeil />
          </div>
        </DemoCard>
        <PropsTable rows={API.darkVeil} />
      </DocSection>

      {/* Balatro */}
      <DocSection id="balatro">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A swirling psychedelic paint vortex: polar coordinates twisted by a radius-dependent spin, then layered sines
          paint the swirl. Dithered.
        </p>
        <DemoCard code={DEMO.balatro}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60">
            <DitherBalatro />
          </div>
        </DemoCard>
        <PropsTable rows={API.balatro} />
      </DocSection>

      {/* Liquid ether */}
      <DocSection id="liquid-ether">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An ethereal flowing colour fluid: coordinates are advected by an fbm flow and stirred by the cursor before
          sampling the ramp. Move the pointer.
        </p>
        <DemoCard code={DEMO.liquidEther}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60">
            <DitherLiquidEther />
          </div>
        </DemoCard>
        <PropsTable rows={API.liquidEther} />
      </DocSection>

      {/* Ballpit */}
      <DocSection id="ballpit">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A pit of shaded spheres bobbing on a grid: sphere shading gives depth, and the balls repel from the cursor.
          Move the pointer to part them.
        </p>
        <DemoCard code={DEMO.ballpit}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherBallpit />
          </div>
        </DemoCard>
        <PropsTable rows={API.ballpit} />
      </DocSection>

      {/* Particles */}
      <DocSection id="particles">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A drifting, twinkling point cloud: each particle wanders on a sine orbit and drifts toward the cursor. Move
          the pointer to gather them.
        </p>
        <DemoCard code={DEMO.particles}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherParticles />
          </div>
        </DemoCard>
        <PropsTable rows={API.particles} />
      </DocSection>

      {/* Hyperspeed */}
      <DocSection id="hyperspeed">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A warp-drive starfield streaking radially from the centre: angular lanes carry hashed star heads rushing
          outward with trailing tails. Dithered.
        </p>
        <DemoCard code={DEMO.hyperspeed}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherHyperspeed />
          </div>
        </DemoCard>
        <PropsTable rows={API.hyperspeed} />
      </DocSection>

      {/* Lightfall */}
      <DocSection id="lightfall">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Soft columns of light drifting downward with long fading trails: each column drops a hashed head; the trail
          fades upward. Dithered.
        </p>
        <DemoCard code={DEMO.lightfall}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherLightfall />
          </div>
        </DemoCard>
        <PropsTable rows={API.lightfall} />
      </DocSection>

      {/* Pixel blast */}
      <DocSection id="pixel-blast">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Expanding shockwave rings broken into chunky pixels: several rings pulse outward from the centre and fade; a
          coarse hash grid pixelates them.
        </p>
        <DemoCard code={DEMO.pixelBlast}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherPixelBlast />
          </div>
        </DemoCard>
        <PropsTable rows={API.pixelBlast} />
      </DocSection>

      {/* Prismatic burst */}
      <DocSection id="prismatic-burst">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A rainbow starburst radiating from the centre: sharpened angular rays take an HSV hue from angle and radius,
          so the burst is a spectrum. Self-colouring.
        </p>
        <DemoCard fit="inset" code={DEMO.prismaticBurst}>
          <div class="relative mx-auto aspect-square h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherPrismaticBurst />
          </div>
        </DemoCard>
        <PropsTable rows={API.prismaticBurst} />
      </DocSection>

      {/* Evil eye */}
      <DocSection id="evil-eye">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A glowing eye whose iris tracks the cursor and that blinks: a lens mask carves the eye; iris rings pulse
          around a dark pupil. Move the pointer.
        </p>
        <DemoCard code={DEMO.evilEye}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
            <DitherEvilEye />
          </div>
        </DemoCard>
        <PropsTable rows={API.evilEye} />
      </DocSection>

      {/* Faulty terminal */}
      <DocSection id="faulty-terminal">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A CRT glyph wall: animated value-noise lights a grid of characters, then scanlines, glitch, flicker, chromatic
          aberration and barrel curvature run over it. No WebGL: it draws through the same Bayer engine as everything
          else, so <code class="text-foreground/80">dither</code> is just an intensity from smooth to hard 1-bit. Fills
          its box; move the pointer over it.
        </p>
        <DemoCard code={termCode()}>
          <div class="relative h-56 overflow-hidden rounded-md border border-border/60">
            <DitherFaultyTerminal
              tint={term.tint}
              scale={termParams().scale}
              glitchAmount={termParams().glitchAmount}
              scanlineIntensity={termParams().scanlineIntensity}
              dither={termParams().dither}
              curvature={termParams().curvature}
              chromaticAberration={termParams().chromaticAberration}
            />
          </div>
          <div class="mt-5 flex flex-wrap items-center justify-center gap-4">
            <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
              <For each={TERM_PRESET_NAMES}>
                {(pName) => (
                  <button
                    type="button"
                    aria-pressed={term.preset === pName}
                    class={chipClass(term.preset === pName)}
                    onClick={() => setTerm("preset", pName)}
                  >
                    {pName}
                  </button>
                )}
              </For>
            </div>
            <div class="flex items-center gap-2">
              <For each={COLORS}>
                {(c) => (
                  <button
                    type="button"
                    aria-label={`Tint ${c}`}
                    aria-pressed={term.tint === c}
                    class={`size-6 rounded-[4px] transition-transform ${term.tint === c ? "ring-1 ring-foreground ring-offset-2 ring-offset-background" : "hover:scale-110"}`}
                    style={{ "background-color": cssColor(c) }}
                    onClick={() => setTerm("tint", c)}
                  />
                )}
              </For>
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.faultyTerminal} />
      </DocSection>

      {/* Ferrofluid */}
      <DocSection id="ferrofluid">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Two fluid layers merge into metaball blobs; their contour rim glows, tinted across the array of colors by
          height. Turbulence swirls the domain, shimmer grains the lines, and the pointer raises a magnetic spike. No
          WebGL: it draws through the same Bayer engine, so the rim comes out crunchy. Fills its box.
        </p>
        <DemoCard code={fluidCode()}>
          <div class="relative h-64 overflow-hidden rounded-md border border-border/60">
            <DitherFerrofluid colors={fluidColors()} flowDirection={fluid.flow} />
          </div>
          <div class="mt-5 flex flex-wrap items-center justify-center gap-4">
            <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
              <For each={FLUID_PALETTE_NAMES}>
                {(pName) => (
                  <button
                    type="button"
                    aria-pressed={fluid.palette === pName}
                    class={chipClass(fluid.palette === pName)}
                    onClick={() => setFluid("palette", pName)}
                  >
                    {pName}
                  </button>
                )}
              </For>
            </div>
            <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
              <For each={FLOW_DIRS}>
                {(dir) => (
                  <button
                    type="button"
                    aria-pressed={fluid.flow === dir}
                    class={chipClass(fluid.flow === dir)}
                    onClick={() => setFluid("flow", dir)}
                  >
                    {dir}
                  </button>
                )}
              </For>
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.ferrofluid} />
      </DocSection>

      {/* Poster */}
      <PosterSection />
    </DEMO_FIT.Provider>
  )
}
