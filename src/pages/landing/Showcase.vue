<script setup lang="ts">
import { ref } from "vue"
import { routePath } from "@/shared/lib"
import {
  DitherBadge,
  DitherButton,
  DitherIcon,
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
  type IconName,
} from "@dither-kit"
import ClayzoFilm from "./ClayzoFilm.vue"
import InstallBlock from "./InstallBlock.vue"
import { COMPONENT_COUNT, RUNTIME_DEPS } from "./facts"
import { SECTION_COUNT, SHELVES } from "./hub"

// The portal (its scale after the dither winners on Awwwards, its voice the
// site's own): a full-bleed hero band, the statement beside ONE film (the
// kit's paint layers), then on the shell the install bar and three columns
// of panels: the Studio pitch with live kit components as product tiles
// and the portraits (a slot: their shake lives on the page); live wells
// (a 3D model, a chart, the video film), each with the docs link that leads
// on; lists into the docs. The other films live in the sections they show.
const HERO_ALT =
  "A dithered dashboard tips into an isometric exploded view of its paint layers, re-seeds its data, flips its switch, presses its button and folds back flat."
const REEL_ALT = "A film strip runs past an ember playhead; each frame holds one moment of a bouncing ball."

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
         the lede, the keys, the kit's numbers) beside ONE film. -->
    <div class="hero">
      <div class="hero-in">
        <div class="statement">
          <h1 id="hero-h" class="display hero-h">A dithered UI toolkit for Vue.</h1>
          <p class="hero-lede">
            Charts, controls, backgrounds, text effects and 3D, each drawn pixel by pixel from one seeded palette. Copy
            the folder into your Vue 3 or Svelte 5 app and every line is yours to change.
          </p>
          <div class="hero-keys">
            <a :href="routePath('/studio')" class="nav-a nav-pill key-primary">Open the studio</a>
            <a :href="routePath('/docs')" class="nav-a nav-pill">Read the docs</a>
          </div>
          <dl class="facts">
            <div v-for="f in FACTS" :key="f.label" class="fact">
              <dt>{{ f.label }}</dt>
              <dd><DitherIcon :name="f.icon" :size="16" :stroke-width="1.5" class="fact-i" />{{ f.value }}</dd>
            </div>
          </dl>
        </div>
        <figure class="hero-film">
          <ClayzoFilm film="hero" chip="Pause the layers film" :label="HERO_ALT" class="hero-play" />
          <figcaption class="hero-cap">
            <DitherIcon name="Layers" :size="14" :stroke-width="1.5" class="cap-i" />
            <span class="cap-t"
              >Four paint layers, one dither rule.
              <span class="hover-only">Point at the film and its grid halves under the cursor.</span></span
            >
            <a :href="routePath('/docs/composition')" class="lead">How components compose</a>
          </figcaption>
        </figure>
      </div>
    </div>

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

        <!-- Column B: live wells and the video film, each with its glyph
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
              <ClayzoFilm film="reel" chip="Pause the video film" :label="REEL_ALT" class="pick-film" />
            </div>
            <figcaption>
              <p class="pick-h">
                <DitherIcon name="Film" :size="14" :stroke-width="1.5" class="pick-i" />
                <a :href="routePath('/docs/stage')" class="lead">Video</a>
              </p>
              <p class="pick-p">One seekable clock, so every frame exports as the same MP4.</p>
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
   statement (left) beside the film (right), which stands on the band's
   floor. Under 900px the statement comes first and the film takes the
   band's width under it. */
.hero {
  background: var(--well);
  box-shadow:
    inset 0 1px 0 var(--line),
    inset 0 -1px 0 var(--line);
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

.fact-i {
  flex: none;
  color: var(--ink-3);
}

.fact dt {
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--ink-3);
}

.hero-film {
  margin: 0;
  align-self: end;
}

.hero-play {
  width: 100%;
  aspect-ratio: 8 / 5;
}

.hero-cap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  padding: 0 0 16px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--ink-3);
}

.cap-i {
  flex: none;
}

.cap-t {
  flex: 1;
  min-width: 14rem;
}

@media (hover: none) {
  .hover-only {
    display: none;
  }
}

@media (max-width: 899px) {
  .hero-in {
    grid-template-columns: minmax(0, 1fr);
    padding: 0;
  }
  .statement {
    padding: 28px 1.5rem 8px;
  }
  .hero-cap {
    padding: 0 1.5rem 16px;
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

/* The 8:5 film across the well's middle. */
.pick-film {
  position: absolute;
  top: 50%;
  width: 100%;
  aspect-ratio: 8 / 5;
  translate: 0 -50%;
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
