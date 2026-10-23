<script setup lang="ts">
import { computed, ref } from "vue"
import { assetPath, routePath } from "@/shared/lib"
import {
  DitherBadge,
  DitherButton,
  DitherGridScan,
  DitherSilk,
  DitherPlasma,
  DitherProgress,
  DitherSlider,
  DitherSwitch,
  DitherWorld,
  Grid,
  Legend,
  Line,
  LineChart,
  XAxis,
  YAxis,
  sampleWorld,
  type DitherColor,
} from "@dither-kit"
import ClayzoFilm from "./ClayzoFilm.vue"
import Hub from "./Hub.vue"
import PixelPlate from "./PixelPlate.vue"
import { dawnPlate, rampPlate, seedPlate, skylinePlate } from "./plates"

// The opening chapter is the reference's feature bento: four cells, each a
// big moving figure over one statement and its links. Two figures are
// Clayzo films (the Studio and the reel, rendered through the kit's dither
// rule — films/), one is the kit's own 3D raster live, and one is the
// page's pixel-art portraits (a slot: their shake lives on the page).
const WORLD = sampleWorld(7)
const DAWN = dawnPlate()
const RAMP = ["#0c1730", "#1e429f", "#2f6fd0", "#7ba3ee", "#c9dbff"]

// Three chapters on the reference's exact grid: a full-width hairline panel;
// inside it a black BAND (statement top-left, links under, a pixel strip on
// its floor) and a 1px-gapped grid of black CELLS. Every strip is computed
// from what its chapter shows — the chart's series, the dither matrix, the
// controls' seed — and all art runs in the page's navy/blue/ice + ember ramp.
const ROWS = [
  { month: "Jan", renders: 46, seeds: 28 },
  { month: "Feb", renders: 52, seeds: 31 },
  { month: "Mar", renders: 49, seeds: 36 },
  { month: "Apr", renders: 58, seeds: 34 },
  { month: "May", renders: 64, seeds: 41 },
  { month: "Jun", renders: 61, seeds: 47 },
  { month: "Jul", renders: 72, seeds: 44 },
  { month: "Aug", renders: 78, seeds: 52 },
  { month: "Sep", renders: 74, seeds: 58 },
  { month: "Oct", renders: 86, seeds: 55 },
  { month: "Nov", renders: 92, seeds: 63 },
  { month: "Dec", renders: 88, seeds: 70 },
]
const CONFIG = {
  renders: { label: "renders", color: "blue" as DitherColor },
  seeds: { label: "seeds", color: "purple" as DitherColor },
}
const SKYLINE = skylinePlate(ROWS.map((r) => r.renders))
const STRIP = rampPlate()

// Controls chapter — real state: the switch toggles the grid behind the
// panel, the slider re-seeds the badge AND the band's strip live (one
// integer, one personality — down to the threshold matrix).
const grid = ref(true)
const seed = ref(512)
const SEEDED = computed(() => seedPlate(seed.value))
</script>

<template>
  <section aria-label="Inside the kit" class="figs mx-auto w-full max-w-[var(--shell)] px-6">
    <!-- Chapter 0 — the bento -->
    <article aria-labelledby="ch-kit-h" class="chapter reveal">
      <div class="band band-tall">
        <div class="band-in">
          <h2 id="ch-kit-h" class="band-h">
            dither-ui<span class="dot">,</span> <span class="band-l">a toolkit where every pixel is placed on purpose.</span>
          </h2>
          <div class="links">
            <a :href="routePath('/docs/getting-started')" class="more">Quick start</a>
            <a :href="routePath('/docs')" class="more more-quiet">Docs</a>
          </div>
        </div>
        <PixelPlate :plate="DAWN" fit="xMaxYMax meet" class="band-fig" />
      </div>
      <div class="cells two">
        <div class="cell feat">
          <ClayzoFilm
            film="studio"
            chip
            label="An ember cursor places three artboards — a bar chart, a line chart, a button — on the Studio's dotted canvas, selects them, and they drain away."
            class="art"
          />
          <h3 class="feat-h">A studio your agent can drive</h3>
          <p class="cell-p">
            Charts, controls and whole screens on an infinite canvas — placed by hand, or by Claude
            Code, Codex or any ACP harness through one protocol.
          </p>
          <div class="links">
            <a :href="routePath('/studio')" class="more">Open studio</a>
            <a :href="assetPath('/agent/SKILL.md')" class="more more-quiet">Agent skill</a>
          </div>
        </div>
        <div class="cell feat">
          <ClayzoFilm
            film="reel"
            chip
            label="A film strip runs past an ember playhead; each frame holds one moment of a bouncing ball."
            class="art"
          />
          <h3 class="feat-h">Every frame is a film</h3>
          <p class="cell-p">
            Any artboard exports as one HyperFrames file that renders to a deterministic MP4; a reel
            cuts frames together with ordered-dither wipes.
          </p>
          <div class="links">
            <a :href="routePath('/docs/motion')" class="more">Animation</a>
          </div>
        </div>
        <div class="cell feat">
          <div class="art">
            <span class="live" aria-hidden="true"><i></i>live · 12 fps</span>
            <DitherWorld
              :source="WORLD"
              :colors="RAMP"
              :auto-rotate="14"
              :grain="0.4"
              :frame-rate="12"
              label="A seeded 3D probe turning slowly, rendered through the kit's Bayer cells"
              class="h-full"
            />
          </div>
          <h3 class="feat-h">3D and GLSL, one raster</h3>
          <p class="cell-p">
            glTF, OBJ, STL, VRML and Shadertoy-style shaders render through the same Bayer cells — on
            the CPU, byte-exact, or through WebGL for big meshes.
          </p>
          <div class="links">
            <a :href="routePath('/docs/world')" class="more">World</a>
            <a :href="routePath('/docs/shader')" class="more more-quiet">Shader</a>
          </div>
        </div>
        <div class="cell feat">
          <div class="art faces"><slot name="faces" /></div>
          <h3 class="feat-h">Pixel art that answers</h3>
          <p class="cell-p">
            Hover a portrait: her pixels scatter under the cursor and spring home, and her emote
            answers.
          </p>
          <div class="links">
            <a :href="routePath('/docs/image')" class="more">Images</a>
          </div>
        </div>
      </div>
    </article>

    <!-- The component hub and its how-row (the reference's cells hub). -->
    <Hub />

    <!-- Chapter 1 — charts -->
    <article aria-labelledby="ch-charts-h" class="chapter reveal">
      <div class="band">
        <!-- The space after the ember comma sits on the same line on purpose:
             Vue's whitespace condense drops newline-only gaps between tags. -->
        <h2 id="ch-charts-h" class="band-h">
          Charts<span class="dot">,</span> <span class="band-l">every mark placed by the same painter.</span>
        </h2>
        <div class="links">
          <a :href="routePath('/docs')" class="more">Docs</a>
          <a :href="routePath('/studio')" class="more more-quiet">Open studio</a>
        </div>
        <PixelPlate :plate="SKYLINE" motion="rise" class="strip" />
      </div>
      <div class="cells">
        <div class="cell">
          <div class="h-52 sm:h-60">
            <LineChart :data="ROWS" :config="CONFIG" :interactive="false" :sparkles="false">
              <Grid horizontal />
              <XAxis data-key="month" :max-ticks="6" />
              <YAxis :tick-count="4" />
              <Line data-key="renders" />
              <Line data-key="seeds" />
              <Legend align="right" />
            </LineChart>
          </div>
          <p class="cell-p">
            Area, line, bar, pie, radar, sparkline — seeded, deterministic,
            alive on scroll.
          </p>
        </div>
      </div>
    </article>

    <!-- Chapter 2 — surfaces -->
    <article aria-labelledby="ch-surfaces-h" class="chapter reveal" style="--reveal-delay: 80ms">
      <div class="band">
        <h2 id="ch-surfaces-h" class="band-h">
          Surfaces<span class="dot">,</span> <span class="band-l">backgrounds that paint themselves.</span>
        </h2>
        <div class="links">
          <a :href="routePath('/docs')" class="more">Browse surfaces</a>
        </div>
        <PixelPlate :plate="STRIP" class="strip" />
      </div>
      <div class="cells three">
        <figure class="cell">
          <div class="frame">
            <span class="live" aria-hidden="true"><i></i>live · 8 fps</span>
            <DitherSilk :frame-rate="8" :colors="['#0c1730', '#2c56c9', '#c9dbff']" />
          </div>
          <figcaption class="cell-p">silk</figcaption>
        </figure>
        <figure class="cell">
          <div class="frame">
            <span class="live" aria-hidden="true"><i></i>live · 8 fps</span>
            <DitherPlasma :frame-rate="8" :colors="['#122a66', '#2f6fd0', '#ff9632']" />
          </div>
          <figcaption class="cell-p">plasma</figcaption>
        </figure>
        <figure class="cell">
          <div class="frame">
            <span class="live" aria-hidden="true"><i></i>live · 8 fps</span>
            <DitherGridScan :frame-rate="8" :colors="['#1e429f', '#7ba3ee']" />
          </div>
          <figcaption class="cell-p">grid scan</figcaption>
        </figure>
      </div>
    </article>

    <!-- Chapter 3 — controls -->
    <article aria-labelledby="ch-controls-h" class="chapter reveal" style="--reveal-delay: 160ms">
      <div class="band">
        <h2 id="ch-controls-h" class="band-h">
          Controls<span class="dot">,</span> <span class="band-l">through the same engine.</span>
        </h2>
        <div class="links">
          <a :href="routePath('/docs')" class="more">Every control</a>
        </div>
        <PixelPlate :plate="SEEDED" class="strip" />
      </div>
      <div class="cells two">
        <div class="cell stage">
          <div v-if="grid" class="grid-bg" aria-hidden="true">
            <DitherGridScan render-mode="static" :colors="['#1e429f', '#7ba3ee']" />
          </div>
          <div class="veil" aria-hidden="true" />
          <div class="stack">
            <div class="row">
              <DitherSwitch v-model="grid" label="grid behind this panel" />
              <span class="row-l">grid</span>
            </div>
            <div class="field">
              <span class="lbl">seed</span>
              <DitherSlider v-model="seed" :min="0" :max="999" label="seed" show-value ticks />
            </div>
          </div>
        </div>
        <div class="cell">
          <div class="stack">
            <div class="btns">
              <DitherButton color="blue" variant="gradient">gradient</DitherButton>
              <DitherButton color="grey" variant="dotted">dotted</DitherButton>
              <DitherButton color="purple" variant="hatched">hatched</DitherButton>
              <DitherButton color="orange" variant="solid">solid</DitherButton>
            </div>
            <div class="field">
              <span class="lbl" id="build-lbl">build</span>
              <DitherProgress :value="Math.round(seed / 10)" aria-labelledby="build-lbl" class="w-full" />
              <div class="row">
                <DitherBadge :seed="seed">seed {{ seed }}</DitherBadge>
                <span class="row-l">one integer = one personality</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
/* Chapters breathe on the page's one section rhythm (--section, set on
   .landing): the same gap above the first chapter, between chapters, and
   below the last. */
.figs {
  display: flex;
  flex-direction: column;
  gap: var(--section);
  padding-block: var(--section);
}

/* Bento cells: a figure box (films are 8:5), then the statement, the
   prose and the links. */
.feat {
  display: flex;
  flex-direction: column;
}

.art {
  position: relative;
  aspect-ratio: 8 / 5;
  overflow: hidden;
  background: #000;
  margin-bottom: clamp(1.25rem, 2.6vw, 1.75rem);
}

.faces {
  display: flex;
  align-items: center;
  justify-content: center;
}

.feat-h {
  margin: 0;
  font-size: clamp(1.125rem, 1.8vw, 1.375rem);
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--color-foreground);
}

.feat .links {
  margin-top: auto;
  padding-top: 20px;
}

/* The reference's .lp-stage: 1.618 box for the demo art. */
.stage {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  background: linear-gradient(180deg, #0a0d14, #000 58%);
}

.stage .stack {
  position: relative;
  z-index: 1;
  width: 100%;
}

.grid-bg {
  position: absolute;
  inset: 0;
  opacity: 0.45;
  pointer-events: none;
}

.veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(0 0 0 / 0.4), rgb(0 0 0 / 0.86) 55%, #000);
  pointer-events: none;
}

.frame {
  position: relative;
  aspect-ratio: 1.618;
  overflow: hidden;
  background: #000;
}

figure {
  margin: 0;
}

figcaption {
  margin-top: 10px;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.lbl {
  font-size: 9.5px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: color-mix(in oklab, var(--color-muted-foreground) 80%, transparent);
}

.row {
  display: flex;
  align-items: center;
  gap: 11px;
}

.row-l {
  font-size: 11px;
  color: var(--color-muted-foreground);
}

.btns {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

</style>
