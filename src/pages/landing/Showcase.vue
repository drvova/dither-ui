<script setup lang="ts">
import { ref } from "vue"
import { routePath } from "@/shared/lib"
import {
  DitherAurora,
  DitherBadge,
  DitherButton,
  DitherIcon,
  DitherLayer,
  DitherLiquidChrome,
  DitherSlider,
  DitherStage,
  DitherSwitch,
  DitherWorld,
  Grid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  sampleWorld,
  type DitherColor,
  type IconName,
} from "@dither-kit"
import HeroStage from "./HeroStage.vue"
import InstallBlock from "./InstallBlock.vue"
import PauseChip from "./PauseChip.vue"
import TrailerDialog from "./TrailerDialog.vue"
import { COMPONENT_COUNT, RUNTIME_DEPS } from "./facts"
import { SECTION_COUNT, SHELVES } from "./hub"

// The portal (its scale after the dither winners on Awwwards, its voice the
// site's own): a full-bleed hero band, the statement beside the stage (the
// kit by hand, one real component at a time), then on the shell the install
// bar and three columns of panels: the Studio pitch with live kit components
// as product tiles and the portraits (a slot: their shake lives on the
// page); live wells (a 3D model, a chart, a keyframed stage), each with the
// docs link that leads on; lists into the docs. Every surface on the page
// is the kit itself; the film is a key away.
const film = ref(false)
const stagePlaying = ref(true)

// The statement's numbers, each one recounted by a test.
const FACTS = [
  { icon: "Grid", value: COMPONENT_COUNT, label: "components, one file each" },
  { icon: "Book", value: SECTION_COUNT, label: "docs sections, every one live" },
  { icon: "Package", value: RUNTIME_DEPS.length, label: "packages beside Vue" },
] as const

// The product tiles' live state: the slider re-seeds the badge.
const dither = ref(true)
const seed = ref(512)

const WORLD = sampleWorld(7)
const RAMP = ["#0c1730", "#1e429f", "#2f6fd0", "#7ba3ee", "#c9dbff"]
const ROWS = [46, 52, 49, 58, 64, 61, 72, 78, 74, 86, 92, 88].map((renders, i) => ({ month: String(i + 1), renders }))
const CONFIG = { renders: { label: "renders", color: "blue" as DitherColor } }

// The docs list: the shelved families, biggest first, each to its first
// section with its glyph; then the handbook.
const FAMILY_ICON: Record<string, IconName> = {
  Components: "Grid",
  Animations: "Pulse",
  Backgrounds: "Image",
  Examples: "Layout",
  Text: "Type",
}
const DOCS = SHELVES.filter((s) => s.value !== "explore")
  .map((s) => ({
    label: s.label,
    icon: FAMILY_ICON[s.label] ?? "Grid",
    count: s.count,
    note: s.note,
    href: routePath(`/docs/${s.cards[0].id}`),
  }))
  .sort((a, b) => b.count - a.count)
const HANDBOOK: { label: string; icon: IconName; note: string; href: string }[] = [
  { label: "Styling", icon: "Palette", note: "Tailwind, CSS, CSS Modules or StyleX", href: routePath("/docs/styling") },
  {
    label: "Composition",
    icon: "Layers",
    note: "Roots hold the context, parts nest inside",
    href: routePath("/docs/composition"),
  },
  { label: "Seeds", icon: "Dice", note: "One integer, one personality", href: routePath("/docs/seeds") },
  { label: "Animation", icon: "Clock", note: "Every animation on one seekable clock", href: routePath("/docs/motion") },
  {
    label: "Accessibility",
    icon: "Accessibility",
    note: "Labels, focus, reduced motion",
    href: routePath("/docs/accessibility"),
  },
]
</script>

<template>
  <section aria-labelledby="hero-h" class="portal">
    <!-- The hero: a full-bleed band; on the shell, the statement (the h1,
         the lede, the keys, the kit's numbers) beside the stage. -->
    <div class="hero">
      <div class="hero-in">
        <div class="statement">
          <h1 id="hero-h" class="display hero-h chrome">A dithered UI toolkit for Vue.</h1>
          <p class="hero-lede">
            Charts, GLSL shaders, controls, backgrounds and 3D, each drawn pixel by pixel from one seeded palette. Copy
            the folder into your Vue 3 or Svelte 5 app, write it as Tailwind, CSS Modules or StyleX, and every line is
            yours to change.
          </p>
          <div class="hero-keys">
            <a :href="routePath('/studio')" class="nav-a nav-pill key-primary">Open the studio</a>
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
                  class="fact-n chrome"
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

      <div class="cols">
        <!-- Column A: the Studio pitch and its products; the portraits. -->
        <div class="col-a">
          <article class="panel build">
            <h2 class="display build-h">Build <span>your own screens</span></h2>
            <p class="build-p">
              Lay out charts, controls and whole screens on an infinite canvas, then export each frame as a Vue file, a
              PNG or an MP4.
            </p>
            <div class="tiles">
              <div class="thumb tile">
                <div class="tile-art">
                  <DitherButton color="blue" variant="gradient">Deploy</DitherButton>
                  <DitherButton color="orange" variant="solid">New frame</DitherButton>
                </div>
                <span class="tile-name">Buttons</span>
              </div>
              <div class="thumb tile">
                <div class="tile-art tile-stack">
                  <div class="tile-row">
                    <DitherSwitch v-model="dither" label="Dither" />
                    <DitherBadge :seed="seed">seed {{ seed }}</DitherBadge>
                  </div>
                  <DitherSlider v-model="seed" :min="0" :max="999" label="Seed" class="tile-slider" />
                </div>
                <span class="tile-name">Controls</span>
              </div>
            </div>
            <div class="build-links">
              <a :href="routePath('/studio')" class="lead">Open the studio</a>
              <a :href="routePath('/docs')" class="lead">Browse all {{ COMPONENT_COUNT }} components</a>
            </div>
          </article>

          <article class="panel feature">
            <h3 class="display feature-h">Pixel art that answers the cursor</h3>
            <p class="feature-p">
              Hover a portrait: her pixels scatter under the cursor and spring home, and her emote answers.
            </p>
            <div class="thumb faces"><slot name="faces" /></div>
          </article>
        </div>

        <!-- Column B: live wells (a model, a chart, a stage), each with its glyph
             and the docs link that leads on. -->
        <div class="col-b">
          <figure class="pick">
            <div class="thumb pick-art">
              <span class="live" aria-hidden="true"><i class="led"></i>Live at 12 fps</span>
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
            <figcaption>
              <p class="pick-h">
                <DitherIcon name="Box" :size="14" :stroke-width="1.5" class="pick-i" />
                <a :href="routePath('/docs/world')" class="lead">3D models</a>
              </p>
              <p class="pick-p">glTF, OBJ, STL and VRML files drawn through the same Bayer cells.</p>
            </figcaption>
          </figure>
          <figure class="pick">
            <div class="thumb pick-art pick-chart">
              <LineChart :data="ROWS" :config="CONFIG" :interactive="false" :sparkles="false">
                <Grid horizontal />
                <XAxis data-key="month" :max-ticks="4" />
                <YAxis :tick-count="3" />
                <Line data-key="renders" />
              </LineChart>
            </div>
            <figcaption>
              <p class="pick-h">
                <DitherIcon name="ChartLine" :size="14" :stroke-width="1.5" class="pick-i" />
                <a :href="routePath('/docs/area')" class="lead">Charts</a>
              </p>
              <p class="pick-p">Seeded and deterministic: the same seed replays the same fill.</p>
            </figcaption>
          </figure>
          <figure class="pick">
            <div class="thumb pick-art">
              <span class="live" aria-hidden="true"><i class="led"></i>Live at 12 fps</span>
              <!-- The docs' stage at well size: an aurora sky and two hills
                   drifting in container units, a moon on its arc. -->
              <DitherStage
                :duration="8"
                :frame-rate="12"
                :paused="!stagePlaying"
                role="img"
                aria-label="A keyframed night scene: an aurora drifts over two hills while a moon crosses the sky"
                class="scene"
              >
                <DitherLayer :keyframes="[{ x: '-6cqw' }, { x: '6cqw' }]" :duration="8" yoyo loop class="sky">
                  <DitherAurora
                    :colors="['#1f6fd6', '#9ec5ff', '#ffffff']"
                    :speed="0.6"
                    :frame-rate="12"
                    :paused="!stagePlaying"
                    class="h-full"
                  />
                </DitherLayer>
                <DitherLayer :keyframes="[{ x: 0 }, { x: '-10cqw' }]" :duration="8" yoyo loop>
                  <svg class="hills far" viewBox="0 0 132 40" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M0 40 V26 Q12 14 24 22 T48 18 T72 24 T96 14 T120 22 T132 18 V40 Z" />
                  </svg>
                </DitherLayer>
                <DitherLayer :keyframes="[{ x: 0 }, { x: '-24cqw' }]" :duration="8" yoyo loop>
                  <svg class="hills near" viewBox="0 0 148 40" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M0 40 V30 Q14 22 28 30 T56 24 T84 32 T112 22 T140 30 T148 26 V40 Z" />
                  </svg>
                </DitherLayer>
                <DitherLayer
                  :keyframes="[
                    { at: 0, x: '80cqw', y: '12cqh', rotate: 0 },
                    { at: '50%', easing: 'ease-in-out', rotate: '0.5turn' },
                    { x: '20cqw', y: '8cqh', rotate: '1turn' },
                  ]"
                  :duration="8"
                  loop
                  origin="0 0"
                  class="moon"
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="9" cy="9" r="2" class="crater" />
                    <circle cx="15" cy="14" r="1.5" class="crater" />
                  </svg>
                </DitherLayer>
              </DitherStage>
              <PauseChip v-model="stagePlaying" label="Pause the stage" class="pick-chip" />
            </div>
            <figcaption>
              <p class="pick-h">
                <DitherIcon name="Film" :size="14" :stroke-width="1.5" class="pick-i" />
                <a :href="routePath('/docs/stage')" class="lead">Video</a>
              </p>
              <p class="pick-p">
                Keyframes in container units on one seekable clock, so every frame exports as an MP4.
              </p>
            </figcaption>
          </figure>
        </div>

        <!-- Column C: lists into the docs, a hairline off the others. -->
        <aside class="col-c" aria-label="Docs">
          <div class="list-head">
            <h3 class="list-h">Docs</h3>
            <a :href="routePath('/docs')" class="more-link">All sections</a>
          </div>
          <ul class="list">
            <li v-for="d in DOCS" :key="d.label">
              <a :href="d.href" class="list-t"
                ><span class="list-l"
                  ><DitherIcon :name="d.icon" :size="14" :stroke-width="1.5" class="list-i" />{{ d.label }}</span
                ><span class="list-n">{{ d.count }}</span></a
              >
              <span class="list-s">{{ d.note }}</span>
            </li>
          </ul>
          <div class="list-head">
            <h3 class="list-h">Handbook</h3>
            <a :href="routePath('/docs/getting-started')" class="more-link">Quick start</a>
          </div>
          <ul class="list">
            <li v-for="h in HANDBOOK" :key="h.label">
              <a :href="h.href" class="list-t"
                ><span class="list-l"
                  ><DitherIcon :name="h.icon" :size="14" :stroke-width="1.5" class="list-i" />{{ h.label }}</span
                ></a
              >
              <span class="list-s">{{ h.note }}</span>
            </li>
          </ul>
        </aside>
      </div>
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

.hero-h {
  margin: 0;
  font-size: clamp(2.2rem, 4.2vw, 3.25rem);
  line-height: 1.02;
  letter-spacing: -0.05em;
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

/* The columns: 1.9 : 1 : 1.2, collapsing to one under 900px. */
.cols {
  display: grid;
  grid-template-columns: minmax(0, 1.9fr) minmax(0, 1fr) minmax(0, 1.2fr);
  gap: 20px;
}

@media (max-width: 899px) {
  .cols {
    grid-template-columns: minmax(0, 1fr);
  }
}

.col-a,
.col-b {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.build,
.feature {
  padding: 20px;
}

.build-h,
.feature-h {
  margin: 0;
  font-size: 15px;
  color: var(--ink);
}

.build-h span {
  color: var(--ink-3);
}

.build-p,
.feature-p {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-3);
}

.tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.tile {
  display: flex;
  flex-direction: column;
  min-height: 9.5rem;
  padding: 12px;
}

.tile-art {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.tile-stack {
  flex-direction: column;
}

.tile-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tile-slider {
  width: 100%;
}

.tile-name {
  align-self: flex-end;
  font-size: 11.5px;
  color: var(--ink-3);
}

.build-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 22px;
  margin-top: 14px;
}

.faces {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding: 4px 8px 16px;
}

.pick {
  margin: 0;
}

.pick-art {
  aspect-ratio: 3 / 2;
}

.pick-chart {
  padding: 10px 8px 4px;
}

/* The stage fills its well: a sky, two hills in container units, a moon. */
.scene {
  position: absolute;
  inset: 0;
}

.sky {
  inset: 0 -6cqw;
}

.hills {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 110%;
  height: 58%;
}

.hills.far path {
  fill: rgba(31, 111, 214, 0.35);
}

.hills.near {
  width: 124%;
  height: 42%;
}

.hills.near path {
  fill: rgba(11, 26, 58, 0.95);
}

.moon {
  inset: auto;
  width: 22px;
  height: 22px;
}

.moon circle {
  fill: rgba(255, 255, 255, 0.85);
}

.moon .crater {
  fill: rgba(11, 26, 58, 0.6);
}

.pick-chip {
  position: absolute;
  right: 12px;
  bottom: 10px;
  z-index: 4;
}

/* Under reduced motion the stage holds its end and the sky one frame:
   nothing moves, so nothing needs pausing. */
@media (prefers-reduced-motion: reduce) {
  .pick-chip {
    display: none;
  }
}

.pick figcaption {
  margin-top: 10px;
}

.pick-h {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.pick-i {
  flex: none;
  color: var(--ink-3);
}

.pick-p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-3);
}

/* Column C: lists under their headings, a hairline off the others. */
.col-c {
  padding-left: 20px;
  box-shadow: inset 1px 0 0 var(--line);
}

@media (max-width: 899px) {
  .col-c {
    padding-left: 0;
    box-shadow: none;
  }
}

.list {
  margin: 8px 0 24px;
  padding: 0;
  list-style: none;
}

.list li {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 11px 0;
  box-shadow: inset 0 -1px 0 color-mix(in oklab, var(--line) 70%, transparent);
}

.list-t {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12.5px;
  color: var(--ink);
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.list-l {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}

.list-i {
  flex: none;
  color: var(--ink-3);
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.list-t:hover .list-i {
  color: var(--ink);
}

.list-n {
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--ink-3);
}

.list-t:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.list-s {
  padding-left: 23px;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--ink-3);
}
</style>
