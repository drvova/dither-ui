<script setup lang="ts">
import { computed, ref } from "vue"
import { routePath } from "@/shared/lib"
import {
  DitherBadge,
  DitherButton,
  DitherSlider,
  DitherSwitch,
  DitherWorld,
  Grid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  sampleWorld,
  type DitherColor,
} from "@dither-kit"
import ClayzoFilm from "./ClayzoFilm.vue"
import InstallBlock from "./InstallBlock.vue"
import PixelPlate from "./PixelPlate.vue"
import { COMPONENT_COUNT } from "./facts"
import { FAMILIES, SECTION_COUNT, SHELVES } from "./hub"
import { catalogLayout, catalogPlate, dawnPlate } from "./plates"

// The portal (its structure after the 2000s oakley.com, its scale after
// the dither winners on Awwwards, its voice the site's own): a full-bleed
// art band — the films as tabbed campaigns, one mounted at a time — then
// the statement at display scale, the install bar and three columns of
// panels: the Studio pitch with live kit components as product tiles and
// the portraits (a slot: their shake lives on the page); framed wells with
// a leading link; lists into the docs under an eyebrow.
const LAYOUT = catalogLayout(FAMILIES.map((f) => f.count))
const FILMS = [
  {
    id: "hero",
    tab: "Layers",
    label: "Four paint layers · one dither rule",
    aspect: "8 / 5",
    wide: false,
    alt: "A dithered dashboard tips into an isometric exploded view of its paint layers, re-seeds its data, flips its switch, presses its button and folds back flat.",
  },
  {
    id: "studio",
    tab: "Studio",
    label: "An infinite canvas your agent can drive",
    aspect: "8 / 5",
    wide: false,
    alt: "A cursor places three artboards on the Studio's dotted canvas — a bar chart, a line chart, a button — selects them, and they drain away.",
  },
  {
    id: "reel",
    tab: "Reel",
    label: "Every frame exports as an MP4",
    aspect: "8 / 5",
    wide: false,
    alt: "A film strip runs past an ember playhead; each frame holds one moment of a bouncing ball.",
  },
  {
    id: "catalog",
    tab: "Catalog",
    label: `${SECTION_COUNT} sections · one window each`,
    aspect: `${LAYOUT.w} / ${LAYOUT.h}`,
    wide: true,
    alt: `The docs catalog as a night skyline: ${SECTION_COUNT} lit windows, one per section, in a tower per family; windows switch on and off and a new section falls onto the tallest roof.`,
  },
  {
    id: "dawn",
    tab: "Dawn",
    label: "Clayzo films · the kit's dither rule",
    aspect: "168 / 46",
    wide: true,
    alt: "Dawn over a dithered planet: the sun breathes on the limb, an aurora sways over the far side, seed moons cross the sky and stars flicker.",
  },
] as const
const picked = ref(0)
const film = computed(() => FILMS[picked.value])
const PLATES: Record<string, ReturnType<typeof dawnPlate>> = {
  catalog: catalogPlate(FAMILIES.map((f) => f.count)),
  dawn: dawnPlate(),
}

// The product tiles' live state: the slider re-seeds the badge.
const dither = ref(true)
const seed = ref(512)

const WORLD = sampleWorld(7)
const RAMP = ["#0c1730", "#1e429f", "#2f6fd0", "#7ba3ee", "#c9dbff"]
const ROWS = [46, 52, 49, 58, 64, 61, 72, 78, 74, 86, 92, 88].map((renders, i) => ({ month: String(i + 1), renders }))
const CONFIG = { renders: { label: "renders", color: "blue" as DitherColor } }

// The docs list: the shelved families, biggest first, each to its first
// section; then the handbook.
const DOCS = SHELVES.filter((s) => s.value !== "explore")
  .map((s) => ({ label: s.label, count: s.count, note: s.note, href: routePath(`/docs/${s.cards[0].id}`) }))
  .sort((a, b) => b.count - a.count)
const HANDBOOK = [
  { label: "Styling", note: "Tailwind, CSS, CSS Modules or StyleX", href: routePath("/docs/styling") },
  { label: "Seeds", note: "One integer, one personality", href: routePath("/docs/seeds") },
  { label: "Animation", note: "Every animation on one seekable clock", href: routePath("/docs/motion") },
  { label: "Accessibility", note: "Labels, focus, reduced motion", href: routePath("/docs/accessibility") },
]
</script>

<template>
  <section aria-labelledby="hero-h" class="portal">
    <!-- The stage: a full-bleed band, the picked film its art; the tabs and
         the mark have their own floor row so no film ever runs under them. -->
    <div class="stage" :data-wide="film.wide ? '' : undefined">
      <div class="stage-view">
        <ClayzoFilm
          :key="film.id"
          :film="film.id"
          chip
          :label="film.alt"
          class="stage-film"
          :style="{ aspectRatio: film.aspect }"
        >
          <template v-if="PLATES[film.id]" #fallback>
            <PixelPlate :plate="PLATES[film.id]" fit="xMidYMax meet" class="block size-full" />
          </template>
        </ClayzoFilm>
        <p class="micro stage-label" aria-hidden="true">{{ film.label }}</p>
      </div>
      <div class="stage-foot">
        <div role="group" aria-label="Films" class="seg stage-tabs">
          <button v-for="(f, i) in FILMS" :key="f.id" type="button" :aria-pressed="picked === i" @click="picked = i">
            {{ f.tab }}
          </button>
        </div>
        <p class="micro stage-badge" aria-hidden="true">dither-kit × Clayzo</p>
      </div>
    </div>

    <div class="shell">
      <!-- The statement at display scale under the art, across the shell;
           the lede and the keys on one row under it. -->
      <div class="intro">
        <p class="eyebrow intro-eyebrow">Every pixel placed on purpose</p>
        <h1 id="hero-h" class="display intro-h">A dithered UI toolkit for Vue.</h1>
        <p class="intro-lede">
          Charts, controls and surfaces, rendered pixel by pixel from one seeded palette — for Vue 3 or Svelte 5.
        </p>
        <div class="intro-keys">
          <a :href="routePath('/studio')" class="nav-a nav-pill key-primary">Open the studio</a>
          <a :href="routePath('/docs')" class="nav-a nav-pill">Read the docs</a>
        </div>
      </div>

      <InstallBlock />

      <div class="cols">
        <!-- Column A: the Studio pitch and its products; the portraits. -->
        <div class="col-a">
          <article class="panel build">
            <h2 class="display build-h">Build <span>your own screens</span></h2>
            <p class="build-p">
              Charts, controls and whole screens on an infinite canvas — placed by hand, or by your agent through one
              protocol.
            </p>
            <div class="tiles">
              <div class="thumb tile">
                <div class="tile-art">
                  <DitherButton color="blue" variant="gradient">Deploy</DitherButton>
                  <DitherButton color="orange" variant="solid">New frame</DitherButton>
                </div>
                <span class="micro tile-name">Buttons</span>
              </div>
              <div class="thumb tile">
                <div class="tile-art tile-stack">
                  <div class="tile-row">
                    <DitherSwitch v-model="dither" label="Dither" />
                    <DitherBadge :seed="seed">seed {{ seed }}</DitherBadge>
                  </div>
                  <DitherSlider v-model="seed" :min="0" :max="999" label="Seed" class="tile-slider" />
                </div>
                <span class="micro tile-name">Controls</span>
              </div>
            </div>
            <div class="build-links">
              <a :href="routePath('/studio')" class="lead">Open the studio</a>
              <a :href="routePath('/docs')" class="lead">Choose from {{ COMPONENT_COUNT }} components</a>
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

        <!-- Column B: framed wells. -->
        <div class="col-b">
          <figure class="pick">
            <div class="thumb pick-art">
              <span class="live micro" aria-hidden="true"><i class="led"></i>live · 12 fps</span>
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
              <a :href="routePath('/docs/world')" class="lead">World 3D</a>
              <p class="pick-p">glTF, OBJ, STL and VRML through the same Bayer cells.</p>
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
              <a :href="routePath('/docs/area')" class="lead">Charts</a>
              <p class="pick-p">Seeded and deterministic: a seed replays a fill forever.</p>
            </figcaption>
          </figure>
        </div>

        <!-- Column C: lists into the docs. -->
        <aside class="col-c" aria-label="Docs">
          <div class="list-head">
            <span class="eyebrow">Docs</span>
            <a :href="routePath('/docs')" class="more-link">all →</a>
          </div>
          <ul class="list">
            <li v-for="d in DOCS" :key="d.label">
              <a :href="d.href" class="list-t"
                >{{ d.label }} <span>· {{ d.count }}</span></a
              >
              <span class="list-s">{{ d.note }}</span>
            </li>
          </ul>
          <div class="list-head">
            <span class="eyebrow">Handbook</span>
            <a :href="routePath('/docs/styling')" class="more-link">all →</a>
          </div>
          <ul class="list">
            <li v-for="h in HANDBOOK" :key="h.label">
              <a :href="h.href" class="list-t">{{ h.label }}</a>
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

/* The stage: a full-bleed band between hairlines, its content edge aligned
   to the shell. 8:5 films stand centred at full height; the wide ones run
   across the floor. The film's label sits top-right; the tabs and the mark
   have their own row. */
.stage {
  --edge: max(1.5rem, calc((100% - var(--shell)) / 2 + 1.5rem));
  background: var(--well);
  box-shadow:
    inset 0 1px 0 var(--line),
    inset 0 -1px 0 var(--line);
}

.stage-view {
  position: relative;
  overflow: hidden;
  height: clamp(20rem, 50vh, 34rem);
}

.stage-film {
  position: absolute;
  top: 0;
  left: 50%;
  height: 100%;
  translate: -50% 0;
}

.stage[data-wide] .stage-film {
  top: auto;
  left: 0;
  bottom: 0;
  width: 100%;
  height: auto;
  translate: none;
}

.stage-label {
  position: absolute;
  top: 14px;
  right: var(--edge);
  margin: 0;
  padding: 3px 7px;
  border-radius: 4px;
  color: var(--ink-3);
  background: color-mix(in oklab, var(--well) 85%, transparent);
}

.stage-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px var(--edge);
  box-shadow: inset 0 1px 0 var(--line);
}

/* The statement: display-scale mono across the shell under the art (two
   lines at desktop, above a 1440×900 fold), the lede and the keys on one
   row under it. */
.intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 0 48px;
  padding-bottom: 16px;
}

.intro-eyebrow,
.intro-h {
  grid-column: 1 / -1;
}

.intro-h {
  margin: 14px 0 22px;
  font-size: clamp(2.4rem, 5.3vw, 5rem);
  line-height: 1;
  letter-spacing: -0.05em;
  text-wrap: balance;
  color: var(--ink);
}

.intro-lede {
  margin: 0;
  max-width: 30rem;
  font-size: 13px;
  line-height: 1.65;
  color: var(--ink-3);
  text-wrap: pretty;
}

.intro-keys {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 759px) {
  .intro {
    grid-template-columns: minmax(0, 1fr);
  }
  .intro-keys {
    margin-top: 20px;
  }
}

.stage-tabs {
  overflow-x: auto;
  scrollbar-width: none;
}

.stage-badge {
  margin: 0;
  color: var(--ink-3);
}

/* The film's pause chip sits in the view's floor corner, clear of the
   label. */
.stage :deep(.film-corner) {
  top: auto;
  right: 14px;
  bottom: 14px;
}

@media (max-width: 759px) {
  .stage-view {
    height: auto;
  }
  .stage-label,
  .stage-badge {
    display: none;
  }
  .stage-film,
  .stage[data-wide] .stage-film {
    position: relative;
    left: 0;
    width: 100%;
    height: auto;
    translate: none;
  }
  .stage-foot {
    padding: 10px 12px;
  }
  .stage-tabs {
    flex: 1;
  }
  .stage-tabs > button {
    flex: 1;
    padding: 0 4px;
  }
}

/* The columns: 2 : 1 : 1.1, collapsing to one under 900px. */
.cols {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1.1fr);
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
  aspect-ratio: 16 / 10;
}

.pick-chart {
  padding: 10px 8px 4px;
}

.pick figcaption {
  margin-top: 10px;
}

.pick-p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-3);
}

/* Column C: lists under eyebrows, a hairline off the others. */
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
  padding: 10px 0;
  box-shadow: inset 0 -1px 0 color-mix(in oklab, var(--line) 70%, transparent);
}

.list-t {
  font-size: 12.5px;
  color: var(--ink);
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.list-t span {
  color: var(--ink-3);
}

.list-t:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.list-s {
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--ink-3);
}
</style>
