<script setup lang="ts">
import { ref } from "vue"
import { routePath } from "@/shared/lib"
import { DitherIcon, DitherLiquidChrome } from "@dither-kit"
import HeroStage from "./HeroStage.vue"
import InstallBlock from "./InstallBlock.vue"
import TrailerDialog from "./TrailerDialog.vue"
import { COMPONENT_COUNT, RUNTIME_DEPS } from "./facts"
import { SECTION_COUNT } from "./hub"

// The portal (its scale after the dither winners on Awwwards, its voice the
// site's own): a full-bleed hero band, the statement beside the stage (the
// kit by hand, one real component at a time, sitting in a pebble of the
// kit's liquid chrome), then on the shell the install bar. Every surface on
// the page is the kit itself; the film is a key away.
const film = ref(false)

// The statement's numbers, each one recounted by a test.
const FACTS = [
  { icon: "Grid", value: COMPONENT_COUNT, label: "components, one file each" },
  { icon: "Book", value: SECTION_COUNT, label: "docs sections, every one live" },
  { icon: "Package", value: RUNTIME_DEPS.length, label: "packages beside Vue" },
] as const
</script>

<template>
  <section aria-labelledby="hero-h" class="portal">
    <!-- The hero: a full-bleed band; on the shell, the statement (the h1,
         the lede, the keys, the kit's numbers) beside the stage. -->
    <div class="hero">
      <div class="hero-in">
        <div class="statement">
          <h1 id="hero-h" class="display hero-h chrome-type">A dithered UI toolkit for Vue.</h1>
          <p class="hero-lede">
            Charts, GLSL shaders, controls, backgrounds and 3D, each drawn pixel by pixel from one seeded palette. Copy
            the folder into your Vue 3 or Svelte 5 app, write it as Tailwind, CSS Modules or StyleX, and every line is
            yours to change.
          </p>
          <div class="hero-keys">
            <a :href="routePath('/studio')" class="nav-a nav-pill key-chrome">Open the studio</a>
            <a :href="routePath('/docs')" class="nav-a nav-pill">Read the docs</a>
            <button type="button" class="nav-a nav-pill" @click="film = true">
              <DitherIcon name="Play" :size="12" :stroke-width="1.5" />Watch the film
            </button>
          </div>
          <dl class="facts">
            <div v-for="f in FACTS" :key="f.label" class="fact">
              <dt class="spec">{{ f.label }}</dt>
              <dd>
                <DitherIcon :name="f.icon" :size="16" :stroke-width="1.5" class="fact-i" /><span
                  class="fact-n chrome-type"
                  >{{ f.value }}</span
                >
              </dd>
            </div>
          </dl>
        </div>
        <div class="stage-col">
          <!-- The biome: a pebble of the kit's liquid chrome (one still frame
               through the Bayer cells) that the stage sits in, past its top
               and outer edges, and a droplet thrown off it. -->
          <div class="biome" aria-hidden="true">
            <div class="pebble">
              <DitherLiquidChrome :scale="1.7" :distortion="1.3" :seed="2002" render-mode="static" class="h-full" />
            </div>
            <div class="pebble drop">
              <DitherLiquidChrome :scale="1.2" :distortion="0.8" :seed="7" render-mode="static" class="h-full" />
            </div>
          </div>
          <HeroStage />
        </div>
      </div>
      <div class="ticks hero-ticks" aria-hidden="true"></div>
    </div>
    <TrailerDialog v-model="film" />

    <div class="shell">
      <InstallBlock />
    </div>
  </section>
</template>

<style scoped>
.portal {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

/* The shell for everything under the band: the docs' width and gutter. */
.shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: var(--shell);
  margin-inline: auto;
  padding-inline: 1.5rem;
}

/* The hero: a full-bleed band between hairlines; on the shell, the
   statement (left) beside the stage (right). Under 900px the statement
   comes first and the stage takes the band's width under it. */
.hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: var(--well);
  box-shadow:
    inset 0 1px 0 var(--line),
    inset 0 -1px 0 var(--line);
}

/* The stage's column holds the biome behind the stage: a chrome pebble
   that shows past the well's top and outer edge (never under its tabs or
   caption), and a droplet off its inner side. Gel-lit: a rim of light and
   a gloss inside. */
.stage-col {
  position: relative;
  isolation: isolate;
  min-width: 0;
}

.biome {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.pebble {
  position: absolute;
  top: -6%;
  right: -12%;
  width: 70%;
  aspect-ratio: 1.15;
  overflow: hidden;
  border-radius: 58% 42% 47% 53% / 46% 55% 45% 54%;
  opacity: 0.42;
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.3),
    inset 14px 18px 40px rgb(255 255 255 / 0.16);
}

/* The gel's specular: a soft oval of light high on the form. */
.pebble::after {
  content: "";
  position: absolute;
  top: 9%;
  left: 14%;
  width: 34%;
  height: 22%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgb(255 255 255 / 0.55), transparent);
  transform: rotate(-24deg);
}

@media (prefers-reduced-transparency: reduce) {
  .biome {
    display: none;
  }
}

.pebble.drop {
  top: 44%;
  right: auto;
  left: -7%;
  width: 12%;
  border-radius: 52% 48% 61% 39% / 44% 58% 42% 56%;
  opacity: 0.5;
}

@media (max-width: 899px) {
  .biome {
    display: none;
  }
}

/* The seam tape along the band's foot. */
.hero-ticks {
  position: absolute;
  inset: auto 0 1px;
  opacity: 0.8;
}

.hero-in {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  align-items: center;
  gap: 0 48px;
  width: 100%;
  max-width: var(--shell);
  margin-inline: auto;
  padding: 0 1.5rem;
}

/* The statement: display-scale mono (two lines at desktop, capped so it
   stays two in its column), the lede, the keys, then the kit's numbers. */
.statement {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  padding: 36px 0;
}

/* The statement in the display face (extended, one weight), sized so it
   holds two lines in its column. */
.hero-h {
  margin: 0;
  font-family: var(--display-face);
  font-size: clamp(1.7rem, 3.1vw, 2.45rem);
  font-weight: 400;
  line-height: 1.12;
  letter-spacing: -0.01em;
  text-wrap: balance;
  color: var(--ink);
}

.hero-lede {
  margin: 0;
  max-width: 34rem;
  font-size: 13px;
  line-height: 1.65;
  color: var(--ink-3);
  text-wrap: pretty;
}

.hero-keys {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* One strip of numbers: each fact its own element, its glyph beside the
   number, hairlines between. */
.facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-self: stretch;
  margin: 6px 0 0;
  padding-top: 18px;
  box-shadow: inset 0 1px 0 var(--line);
}

.fact {
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  gap: 6px;
  padding: 0 16px;
  box-shadow: inset 1px 0 0 var(--line);
}

.fact:first-child {
  padding-left: 0;
  box-shadow: none;
}

.fact dd {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: clamp(1.4rem, 2.2vw, 1.85rem);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

/* The readout: chrome numerals leaning forward, as on a sportswear spec. */
.fact-n {
  display: inline-block;
  padding-right: 0.1em;
  transform: skewX(-9deg);
}

.fact-i {
  flex: none;
  color: var(--ink-3);
}

.fact dt {
  line-height: 1.55;
}

@media (max-width: 899px) {
  .hero-in {
    grid-template-columns: minmax(0, 1fr);
    padding: 0;
  }
  .statement {
    padding: 28px 1.5rem 8px;
  }
}

@media (max-width: 479px) {
  .fact {
    padding: 0 10px;
  }
  .fact dd {
    gap: 6px;
  }
}
</style>
