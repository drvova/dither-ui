<script setup lang="ts">
import { computed, ref } from "vue"
import { routePath } from "@/shared/lib"
import {
  DitherAurora,
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
import { COMPONENT_COUNT, RUNTIME_DEPS } from "./facts"
import { FAMILIES, SECTION_COUNT, SHELVES } from "./hub"
import { catalogLayout, catalogPlate, dawnPlate } from "./plates"

// The portal (its structure after the 2000s oakley.com, its scale after
// the dither winners on Awwwards, its voice the site's own): a full-bleed
// band holding the films beside their index and caption, then the
// statement at display scale with the kit's numbers, the install bar and
// three columns of panels: the Studio pitch with live kit components as
// product tiles and the portraits (a slot: their shake lives on the page);
// live wells, each with the docs link that leads on; lists into the docs.
const LAYOUT = catalogLayout(FAMILIES.map((f) => f.count))
const FILMS = [
  {
    id: "hero",
    tab: "Layers",
    title: "Four paint layers, one dither rule",
    text: "A dashboard tips apart into the layers the kit paints, re-seeds its data, flips its switch and presses its button. Every layer lands on one 4×4 Bayer grid, so they stack without a seam.",
    link: { label: "How components compose", href: "/docs/composition" },
    aspect: "8 / 5",
    wide: false,
    alt: "A dithered dashboard tips into an isometric exploded view of its paint layers, re-seeds its data, flips its switch, presses its button and folds back flat.",
  },
  {
    id: "studio",
    tab: "Studio",
    title: "A canvas your agent can drive",
    text: "Frames land on the Studio's canvas: a bar chart, a line chart, a button. Place them by hand, or let your coding agent place them with the same commands.",
    link: { label: "Open the studio", href: "/studio" },
    aspect: "8 / 5",
    wide: false,
    alt: "A cursor places three artboards on the Studio's dotted canvas: a bar chart, a line chart and a button. It selects them, and they drain away.",
  },
  {
    id: "reel",
    tab: "Reel",
    title: "Every frame exports as an MP4",
    text: "Each animation runs on one seekable clock, so any frame in the Studio exports as a composition that renders the same MP4 every time.",
    link: { label: "Read the animation guide", href: "/docs/motion" },
    aspect: "8 / 5",
    wide: false,
    alt: "A film strip runs past an ember playhead; each frame holds one moment of a bouncing ball.",
  },
  {
    id: "catalog",
    tab: "Catalog",
    title: `${SECTION_COUNT} sections, one window each`,
    text: "The docs as a skyline: one lit window per section, one tower per family. When a section ships, its window falls onto the tallest roof.",
    link: { label: "Browse all sections", href: "/docs" },
    aspect: `${LAYOUT.w} / ${LAYOUT.h}`,
    wide: true,
    alt: `The docs catalog as a night skyline: ${SECTION_COUNT} lit windows, one per section, in a tower per family; windows switch on and off and a new section falls onto the tallest roof.`,
  },
  {
    id: "dawn",
    tab: "Dawn",
    title: "A planet in the kit's palette",
    text: "Sun, aurora and seed moons share the hues the components use. It is vector art drawn live through the same dither rule, not a video file.",
    link: { label: "See the backgrounds", href: "/docs/aurora" },
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

// The statement's numbers, each one recounted by a test.
const FACTS = [
  { value: COMPONENT_COUNT, label: "components, one file each" },
  { value: SECTION_COUNT, label: "docs sections, every one live" },
  { value: RUNTIME_DEPS.length, label: "packages beside Vue" },
]

// The product tiles' live state: the slider re-seeds the badge.
const dither = ref(true)
const seed = ref(512)

const WORLD = sampleWorld(7)
const RAMP = ["#0c1730", "#1e429f", "#2f6fd0", "#7ba3ee", "#c9dbff"]
const AURORA = ["#1e429f", "#7ba3ee", "#2f6fd0"]
const ROWS = [46, 52, 49, 58, 64, 61, 72, 78, 74, 86, 92, 88].map((renders, i) => ({ month: String(i + 1), renders }))
const CONFIG = { renders: { label: "renders", color: "blue" as DitherColor } }
const BACKGROUNDS = FAMILIES.find((f) => f.title === "Backgrounds")!.count

// The docs list: the shelved families, biggest first, each to its first
// section; then the handbook.
const DOCS = SHELVES.filter((s) => s.value !== "explore")
  .map((s) => ({ label: s.label, count: s.count, note: s.note, href: routePath(`/docs/${s.cards[0].id}`) }))
  .sort((a, b) => b.count - a.count)
const HANDBOOK = [
  { label: "Styling", note: "Tailwind, CSS, CSS Modules or StyleX", href: routePath("/docs/styling") },
  { label: "Composition", note: "Roots hold the context, parts nest inside", href: routePath("/docs/composition") },
  { label: "Seeds", note: "One integer, one personality", href: routePath("/docs/seeds") },
  { label: "Animation", note: "Every animation on one seekable clock", href: routePath("/docs/motion") },
  { label: "Accessibility", note: "Labels, focus, reduced motion", href: routePath("/docs/accessibility") },
]
</script>

<template>
  <section aria-labelledby="hero-h" class="portal">
    <!-- The stage: a full-bleed band; on the shell, the films' index and
         the picked film's caption on the left, the film on the right. -->
    <div class="stage" :data-wide="film.wide ? '' : undefined">
      <div class="stage-in">
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
        </div>
        <div class="stage-side">
          <div role="group" aria-label="Films" class="reel">
            <button v-for="(f, i) in FILMS" :key="f.id" type="button" :aria-pressed="picked === i" @click="picked = i">
              <span class="reel-n" aria-hidden="true">{{ String(i + 1).padStart(2, "0") }}</span>
              {{ f.tab }}
            </button>
          </div>
          <div class="caption">
            <p class="caption-h">{{ film.title }}</p>
            <p class="caption-p">{{ film.text }}</p>
            <a :href="routePath(film.link.href)" class="lead">{{ film.link.label }}</a>
          </div>
          <p class="stage-note">
            Every film renders live through the kit's dither rule.
            <span class="hover-only">Point at one and its grid halves under the cursor.</span>
          </p>
        </div>
      </div>
    </div>

    <div class="shell">
      <!-- The statement at display scale, the kit's numbers beside it; the
           lede and the keys on one row under it. -->
      <div class="intro">
        <h1 id="hero-h" class="display intro-h">A dithered UI toolkit for Vue.</h1>
        <dl class="facts">
          <div v-for="f in FACTS" :key="f.label" class="fact">
            <dt>{{ f.label }}</dt>
            <dd>{{ f.value }}</dd>
          </div>
        </dl>
        <p class="intro-lede">
          Charts, controls, backgrounds, text effects and 3D, each drawn pixel by pixel from one seeded palette. Copy
          the folder into your Vue 3 or Svelte 5 app and every line is yours to change.
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

        <!-- Column B: live wells, each with the docs link that leads on. -->
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
              <a :href="routePath('/docs/world')" class="lead">3D models</a>
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
              <a :href="routePath('/docs/area')" class="lead">Charts</a>
              <p class="pick-p">Seeded and deterministic: the same seed replays the same fill.</p>
            </figcaption>
          </figure>
          <figure class="pick">
            <div class="thumb pick-art">
              <span class="live" aria-hidden="true"><i class="led"></i>Live at 8 fps</span>
              <DitherAurora :colors="AURORA" :amplitude="0.6" :blend="0.7" :frame-rate="8" class="h-full" />
            </div>
            <figcaption>
              <a :href="routePath('/docs/aurora')" class="lead">Backgrounds</a>
              <p class="pick-p">{{ BACKGROUNDS }} canvas backdrops that paint themselves, at 8 fps or at 60.</p>
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
                >{{ d.label }} <span class="list-n">{{ d.count }}</span></a
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

/* The stage: a full-bleed band between hairlines; on the shell, the film
   (right) beside its index and caption (left). 8:5 films stand at the
   view's full height; the wide ones run across its floor. */
.stage {
  background: var(--well);
  box-shadow:
    inset 0 1px 0 var(--line),
    inset 0 -1px 0 var(--line);
}

.stage-in {
  display: grid;
  grid-template-columns: minmax(15rem, 19rem) minmax(0, 1fr);
  gap: 0 40px;
  width: 100%;
  max-width: var(--shell);
  margin-inline: auto;
  padding: 0 1.5rem;
}

.stage-side {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  padding: 20px 0;
}

.stage-view {
  grid-column: 2;
  grid-row: 1;
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

/* The films' index: numbered rows, the picked one ringed. */
.reel {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reel > button {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 6px;
  text-align: left;
  font-size: 13px;
  color: var(--ink-3);
  transition:
    color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.reel > button:hover {
  color: var(--ink);
}

.reel > button[aria-pressed="true"] {
  color: var(--ink);
  background: color-mix(in oklab, var(--foreground) 4%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--foreground) 20%, transparent);
}

.reel-n {
  font-size: 11px;
  color: var(--ink-3);
}

.reel > button[aria-pressed="true"] .reel-n {
  color: var(--swatch-orange);
}

.caption {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding-top: 14px;
  box-shadow: inset 0 1px 0 var(--line);
}

.caption-h {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.caption-p {
  margin: 0 0 4px;
  font-size: 12px;
  line-height: 1.65;
  color: var(--ink-3);
  text-wrap: pretty;
}

.stage-note {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: color-mix(in oklab, var(--ink-3) 85%, transparent);
}

@media (hover: none) {
  .hover-only {
    display: none;
  }
}

/* The film's pause chip sits in the view's floor corner. */
.stage :deep(.film-corner) {
  top: auto;
  right: 14px;
  bottom: 14px;
}

/* Under 900px the film takes the band's width and the index runs across
   under it as tabs, the caption beneath. */
@media (max-width: 899px) {
  .stage-in {
    grid-template-columns: minmax(0, 1fr);
    padding: 0;
  }
  .stage-view {
    grid-column: 1;
    grid-row: 1;
    height: auto;
  }
  .stage-film,
  .stage[data-wide] .stage-film {
    position: relative;
    left: 0;
    width: 100%;
    height: auto;
    translate: none;
  }
  .stage-side {
    grid-column: 1;
    grid-row: 2;
    gap: 16px;
    padding: 10px 1.5rem 20px;
    box-shadow: inset 0 1px 0 var(--line);
  }
  .reel {
    flex-direction: row;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .reel > button {
    flex: 1;
    justify-content: center;
    gap: 6px;
    padding: 0 6px;
    font-size: 12px;
  }
  .reel-n {
    display: none;
  }
  .caption {
    padding-top: 0;
    box-shadow: none;
  }
}

/* The statement: display-scale mono with the kit's numbers beside it (two
   lines at desktop, capped so it stays two beside the numbers; above the
   1280×800, 1440×900 and 1920×1080 folds), the lede and the keys under. */
.intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 22px 48px;
  padding-bottom: 16px;
}

.intro-h {
  margin: 0;
  font-size: clamp(2.4rem, 5.3vw, 4.25rem);
  line-height: 1;
  letter-spacing: -0.05em;
  text-wrap: balance;
  color: var(--ink);
}

/* One strip of numbers: each fact its own element, hairlines between. */
.facts {
  display: flex;
  margin: 0 0 6px;
}

.fact {
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  gap: 6px;
  width: 8.5rem;
  padding: 0 18px;
  box-shadow: inset 1px 0 0 var(--line);
}

.fact dd {
  margin: 0;
  font-size: clamp(1.5rem, 2.4vw, 2.1rem);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

.fact dt {
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--ink-3);
}

.intro-lede {
  margin: 0;
  max-width: 34rem;
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

@media (max-width: 899px) {
  .intro {
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
  }
  .facts {
    margin: 0;
  }
  .fact {
    flex: 1;
    width: auto;
    padding: 0 12px;
  }
  .fact:first-child {
    padding-left: 0;
    box-shadow: none;
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
  padding: 10px 0;
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
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--ink-3);
}
</style>
