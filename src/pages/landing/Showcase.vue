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

// The portal, after the 2009 oakley.com: a campaign STAGE — the films as
// tabbed campaigns (one mounted at a time), the statement over them — the
// install bar, then three columns of panels: the Studio pitch with live kit
// components as product tiles and the portraits (a slot: their shake lives
// on the page); framed thumbnails with red-triangle links; red-tagged lists
// into the docs.
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
    <!-- The stage: the picked film behind the statement. -->
    <div class="stage" :data-wide="film.wide ? '' : undefined">
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
      <div class="stage-scrim" aria-hidden="true"></div>
      <div class="stage-copy">
        <p class="display stage-kicker">Every pixel placed on purpose</p>
        <h1 id="hero-h" class="display stage-h">A dithered UI toolkit for Vue.</h1>
        <p class="stage-lede">
          Charts, controls and surfaces, rendered pixel by pixel from one seeded palette — for Vue 3
          or Svelte 5.
        </p>
        <div class="stage-keys">
          <a :href="routePath('/studio')" class="btn btn-primary">Open the studio</a>
          <a :href="routePath('/docs')" class="btn">Read the docs</a>
        </div>
      </div>
      <p class="display stage-label" aria-hidden="true">{{ film.label }}</p>
      <div class="stage-foot">
        <div role="group" aria-label="Films" class="stage-tabs">
          <button
            v-for="(f, i) in FILMS"
            :key="f.id"
            type="button"
            class="display stage-tab"
            :aria-pressed="picked === i"
            @click="picked = i"
          >
            {{ f.tab }}
          </button>
        </div>
        <p class="display stage-badge" aria-hidden="true">dither-kit <span>×</span> Clayzo</p>
      </div>
    </div>

    <div class="portal-body">
      <InstallBlock />

      <div class="cols">
        <!-- Column A: the Studio pitch and its products; the portraits. -->
        <div class="col-a">
          <article class="panel build">
            <div class="build-head">
              <div>
                <h2 class="display build-h"><b>Build</b> your own screens</h2>
                <p class="build-p">
                  Charts, controls and whole screens on an infinite canvas — placed by hand, or by your
                  agent through one protocol.
                </p>
              </div>
              <svg class="build-mark" viewBox="0 0 7 7" aria-hidden="true" focusable="false" shape-rendering="crispEdges">
                <defs>
                  <linearGradient id="build-chrome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#f4f4f4" />
                    <stop offset="0.48" stop-color="#9a9a9a" />
                    <stop offset="0.52" stop-color="#5e5e5e" />
                    <stop offset="1" stop-color="#d8d8d8" />
                  </linearGradient>
                </defs>
                <path d="M3 0h1v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-1h1v-1h1v-1h1z" fill="url(#build-chrome)" />
                <rect x="3" y="3" width="1" height="1" fill="var(--swatch-orange)" />
              </svg>
            </div>
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
              <a :href="routePath('/docs')" class="lead">Choose from {{ COMPONENT_COUNT }} components</a>
            </div>
          </article>

          <article class="panel feature">
            <h3 class="display feature-h">Pixel art that answers the cursor</h3>
            <p class="feature-p">
              Hover a portrait: her pixels scatter under the cursor and spring home, and her emote
              answers.
            </p>
            <div class="thumb faces"><slot name="faces" /></div>
          </article>
        </div>

        <!-- Column B: framed thumbnails. -->
        <div class="col-b">
          <figure class="pick">
            <div class="thumb pick-art">
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

        <!-- Column C: tagged lists into the docs. -->
        <aside class="col-c" aria-label="Docs">
          <div class="list-head">
            <span class="tag">Docs</span>
            <a :href="routePath('/docs')" class="more-link">View all »</a>
          </div>
          <ul class="list">
            <li v-for="d in DOCS" :key="d.label">
              <a :href="d.href" class="list-t">{{ d.label }} · {{ d.count }} sections</a>
              <span class="list-s">{{ d.note }}</span>
            </li>
          </ul>
          <div class="list-head">
            <span class="tag">Handbook</span>
            <a :href="routePath('/docs/styling')" class="more-link">View all »</a>
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
/* The stage runs flush across the top of the page's box; the rest sits
   in the box's padding. */
.portal-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px var(--gutter) 0;
}

/* The stage: a cinematic box. Films of the 8:5 kind sit right at full
   height; the wide ones run across its floor. A scrim keeps the copy
   legible; the copy sits top-left, the film's label top-right, the tabs
   and badge along the floor. */
.stage {
  position: relative;
  overflow: hidden;
  min-height: 24rem;
  aspect-ratio: 64 / 24;
  background: radial-gradient(90% 120% at 70% 30%, #1d1d1d 0%, #050505 70%);
  box-shadow: inset 0 -1px 0 #2a2a2a;
}

.stage-film {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
}

.stage[data-wide] .stage-film {
  top: auto;
  left: 0;
  bottom: 0;
  width: 100%;
  height: auto;
}

.stage-scrim {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(90deg, rgb(5 5 5 / 0.92) 0%, rgb(5 5 5 / 0.7) 34%, transparent 60%);
}

.stage-copy {
  position: absolute;
  top: clamp(1.5rem, 4vw, 2.5rem);
  left: clamp(1.25rem, 3.5vw, 2.25rem);
  max-width: 26rem;
}

.stage-kicker {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--ink-2);
}

.stage-h {
  margin: 6px 0 0;
  font-size: clamp(2.25rem, 5vw, 3.5rem);
  line-height: 0.95;
  letter-spacing: 0.06em;
  color: #fff;
  text-shadow: 0 2px 0 rgb(0 0 0 / 0.6);
}

.stage-lede {
  margin: 14px 0 0;
  max-width: 22rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--ink-2);
  text-wrap: pretty;
}

.stage-keys {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.stage-label {
  position: absolute;
  top: 18px;
  right: 22px;
  margin: 0;
  font-size: 1.125rem;
  letter-spacing: 0.06em;
  color: #fff;
  text-shadow: 0 1px 0 rgb(0 0 0 / 0.8);
}

.stage-foot {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 0 14px 0 0;
}

/* Bevelled tabs; the picked one is chrome. */
.stage-tabs {
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
}

.stage-tab {
  min-width: 6.5rem;
  height: 30px;
  padding: 0 14px;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #b8b8b8;
  background: linear-gradient(180deg, #3a3a3a 0%, #232323 100%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.12),
    inset -1px 0 0 #0c0c0c;
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.stage-tab:hover {
  color: #fff;
}

.stage-tab[aria-pressed="true"] {
  color: var(--on-chrome);
  background: var(--chrome);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.7),
    inset -1px 0 0 #0c0c0c;
}

.stage-tab:focus-visible {
  outline: 2px solid #fff;
  outline-offset: -2px;
}

.stage-tab[aria-pressed="true"]:focus-visible {
  outline-color: var(--on-chrome);
}

.stage-badge {
  margin: 0 0 8px;
  font-size: 0.8125rem;
  letter-spacing: 0.14em;
  color: #9a9a9a;
}

.stage-badge span {
  color: var(--mark);
}

/* The film's pause chip sits clear of the label. */
.stage :deep(.film-corner) {
  top: auto;
  right: 12px;
  bottom: 40px;
}

@media (max-width: 759px) {
  .stage {
    display: flex;
    flex-direction: column;
    aspect-ratio: auto;
    min-height: 0;
  }
  .stage-copy {
    position: relative;
    inset: auto;
    max-width: none;
    padding: 1.5rem 1.25rem 1.25rem;
  }
  .stage-scrim,
  .stage-label {
    display: none;
  }
  .stage-film,
  .stage[data-wide] .stage-film {
    position: relative;
    width: 100%;
    height: auto;
  }
  .stage-foot {
    position: relative;
    flex-direction: column;
    align-items: stretch;
    padding: 0;
  }
  .stage-badge {
    display: none;
  }
  .stage-tab {
    flex: 1;
    min-width: 0;
    padding: 0 4px;
  }
}

/* The columns: 2 : 1 : 1.1, collapsing to one under 900px. */
.cols {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 18px;
  margin-top: 6px;
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
  gap: 18px;
}

.build {
  padding: 18px 18px 14px;
}

.build-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.build-h {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 500;
  color: var(--ink-2);
}

.build-h b {
  font-weight: 700;
  color: #fff;
}

.build-p {
  margin: 6px 0 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--ink-3);
}

.build-mark {
  flex: none;
  width: 42px;
  height: 42px;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
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
  font-size: 0.75rem;
  color: var(--ink-3);
}

.build-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 20px;
  margin-top: 12px;
}

.feature {
  padding: 18px;
}

.feature-h {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--ink);
}

.feature-p {
  margin: 6px 0 0;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: var(--ink-3);
}

.faces {
  display: flex;
  justify-content: center;
  margin-top: 14px;
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
  margin-top: 8px;
}

.pick-p {
  margin: 4px 0 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--ink-3);
}

/* Column C: a hairline off the others, lists under tags. */
.col-c {
  padding-left: 18px;
  box-shadow: inset 1px 0 0 var(--line);
}

@media (max-width: 899px) {
  .col-c {
    padding-left: 0;
    box-shadow: none;
  }
}

.list {
  margin: 10px 0 22px;
  padding: 0;
  list-style: none;
}

.list li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 0;
  box-shadow: inset 0 -1px 0 #262626;
}

.list-t {
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--ink-2);
}

.list-t:hover {
  color: #fff;
}

.list-t:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}

.list-s {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--ink-3);
}
</style>
