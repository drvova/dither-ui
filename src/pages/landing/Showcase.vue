<script setup lang="ts">
import { computed, ref } from "vue"
import { routePath } from "@/shared/lib"
import {
  DitherBadge,
  DitherButton,
  DitherGridScan,
  DitherSilk,
  DitherPlasma,
  DitherProgress,
  DitherSlider,
  DitherSwitch,
  Grid,
  Legend,
  Line,
  LineChart,
  XAxis,
  YAxis,
  type DitherColor,
} from "@dither-kit"
import PixelPlate from "./PixelPlate.vue"
import { rampPlate, seedPlate, skylinePlate } from "./plates"

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
const RAMP = rampPlate()

// Controls chapter — real state: the switch toggles the grid behind the
// panel, the slider re-seeds the badge AND the band's strip live (one
// integer, one personality — down to the threshold matrix).
const grid = ref(true)
const seed = ref(512)
const SEEDED = computed(() => seedPlate(seed.value))
</script>

<template>
  <section aria-label="Inside the kit" class="figs mx-auto w-full max-w-[var(--shell)] px-6">
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
        <PixelPlate :plate="RAMP" class="strip" />
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

/* Chapter = one panel: black band, then a 1px-gapped grid of black cells
   (the reference's .lp-panel over --color-void). */
.chapter {
  background: color-mix(in oklab, var(--color-border) 45%, transparent);
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--color-border) 45%, transparent);
  display: grid;
  gap: 1px;
}

.band {
  --pad: clamp(1.5rem, 3.4vw, 2.125rem);
  background: #05060a;
  position: relative;
  overflow: hidden;
  padding: var(--pad);
}

/* The band's floor: its pixel strip bleeds to both edges and sits flush on
   the bottom hairline (the reference's band field, as markup). */
.strip {
  width: calc(100% + 2 * var(--pad));
  height: auto;
  margin: clamp(1.75rem, 3.4vw, 2.5rem) calc(-1 * var(--pad)) calc(-1 * var(--pad));
}

.band-h {
  margin: 0;
  font-size: clamp(1.625rem, 3.2vw, 2.625rem);
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: var(--color-foreground);
  text-wrap: pretty;
}

.dot {
  color: var(--swatch-orange);
}

.band-l {
  color: var(--color-muted-foreground);
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 26px;
}

/* The reference's .lp-more: square ember button + quiet sibling. */
.more {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 13px;
  background: var(--swatch-orange);
  color: #05060a;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.more:hover {
  background: var(--swatch-blue);
}

.more:focus-visible {
  outline: 2px solid var(--color-foreground);
  outline-offset: 2px;
}

.more-quiet {
  background: color-mix(in oklab, var(--color-foreground) 8%, transparent);
  color: var(--color-muted-foreground);
}

.more-quiet:hover {
  background: color-mix(in oklab, var(--color-foreground) 14%, transparent);
  color: var(--color-foreground);
}

/* Cell grid: hairline gaps come from the panel background showing through.
   Chapter 2 is a 3-up; chapter 3 is demo + prose. */
.cells {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  background: color-mix(in oklab, var(--color-border) 45%, transparent);
}

.cells.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.cells.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.cell {
  background: #05060a;
  padding: clamp(1.25rem, 2.6vw, 2.125rem);
  min-width: 0;
}

/* The reference's .lp-stage: 1.618 box for the demo art. */
.stage {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  background: linear-gradient(180deg, #0a0d14, #05060a 58%);
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
  background: linear-gradient(180deg, rgb(5 6 10 / 0.4), rgb(5 6 10 / 0.86) 55%, #05060a);
  pointer-events: none;
}

.frame {
  position: relative;
  aspect-ratio: 1.618;
  overflow: hidden;
  background: #000;
}

/* The live chip: the nodecode film-chip anatomy (pulsing dot + micro-caps
   label) on our honest data — these panels ARE live kit canvases at 8fps.
   The dot takes the reference's led cadence; it is a state label, so the
   text stays under reduced motion and only the pulse dies. */
.live {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 7px;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: color-mix(in oklab, var(--color-foreground) 75%, transparent);
  background: color-mix(in oklab, #000 62%, transparent);
  border: 1px solid color-mix(in oklab, var(--color-border) 50%, transparent);
}

.live i {
  width: 5px;
  height: 5px;
  background: var(--swatch-orange);
}

@media (prefers-reduced-motion: no-preference) {
  .live i {
    animation: live-led 2.8s ease-in-out infinite;
  }
  @keyframes live-led {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.32;
    }
  }
}

figure {
  margin: 0;
}

figcaption {
  margin-top: 10px;
}

.cell-p {
  margin: 13px 0 0;
  max-width: 34em;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-muted-foreground);
  text-wrap: pretty;
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

@media (max-width: 900px) {
  .cells.three {
    grid-template-columns: minmax(0, 1fr);
  }
  .cells.two {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
