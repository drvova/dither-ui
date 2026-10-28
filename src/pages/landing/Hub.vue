<script setup lang="ts">
// The directory: the docs under a head (the title, one line and its link
// beside the kit's own bar chart of the docs, one bar per family sized by
// its sections), then a bento of big live kit components the rest of the
// page does not show, each leading into its docs section by name, and
// under it what every preview in the docs lets you do.
import { ref } from "vue"
import {
  Bar,
  BarChart,
  DitherDecryptedText,
  DitherGalaxy,
  DitherIcon,
  DitherMetaBalls,
  DitherProgress,
  DitherRating,
  Grid,
  Legend,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  Sparkline,
  Tooltip,
  YAxis,
  type DitherColor,
  type IconName,
} from "@dither-kit"
import { routePath } from "@/shared/lib"
import PauseChip from "./PauseChip.vue"
import { BENTO, FAMILIES, SECTION_COUNT } from "./hub"

// The head's chart: one row, every family its own series in sidebar order,
// the big families in a hue, the rest grey.
const HUE: Record<string, DitherColor> = {
  Components: "blue",
  Backgrounds: "purple",
  Text: "green",
  Animations: "orange",
  Examples: "pink",
}
const ROWS = [{ docs: "Sections", ...Object.fromEntries(FAMILIES.map((f) => [f.title, f.count])) }]
const CONFIG = Object.fromEntries(FAMILIES.map((f) => [f.title, { label: f.title, color: HUE[f.title] ?? "grey" }]))

// The tiles' own state: what each live example shows, and the two surfaces
// that move by themselves, each with its pause.
const RADAR_ROWS = [
  { axis: "shipped", current: 9, previous: 6 },
  { axis: "reviewed", current: 7, previous: 7 },
  { axis: "tested", current: 8, previous: 5 },
  { axis: "documented", current: 6, previous: 3 },
  { axis: "on time", current: 8, previous: 6 },
]
const RADAR_CONFIG = {
  current: { label: "This sprint", color: "blue" as DitherColor },
  previous: { label: "Last sprint", color: "grey" as DitherColor },
}
const PIE_ROWS = [
  { name: "Vue", value: 58 },
  { name: "Svelte", value: 27 },
  { name: "Other", value: 15 },
]
const PIE_CONFIG = {
  Vue: { label: "Vue", color: "green" as DitherColor },
  Svelte: { label: "Svelte", color: "orange" as DitherColor },
  Other: { label: "Other", color: "grey" as DitherColor },
}
const SPARK = [12, 14, 13, 17, 16, 19, 18, 22, 21, 24, 23, 27, 26, 29, 31, 30, 33, 35]
const BLOBS = ["#3f8ff3", "#9b7bff", "#7fe3ff"]
const stars = ref(4)
const ballsPlaying = ref(true)
const galaxyPlaying = ref(true)

// The docs' preview tools (the workbench and the source panel), each with
// the section that shows it best.
const TOOLS: { title: string; icon: IconName; text: string; link: { label: string; href: string } }[] = [
  {
    title: "Inspect",
    icon: "Crosshair",
    text: "Measure spacing, check contrast and the Tab order, annotate and record any preview.",
    link: { label: "Inspect the button", href: "/docs/button" },
  },
  {
    title: "Edit and run",
    icon: "Code",
    text: "Open the code as files, change the example or the kit's own source, and run it in place.",
    link: { label: "Edit the switch", href: "/docs/switch" },
  },
  {
    title: "Hand it to your agent",
    icon: "Bot",
    text: "Copy your notes as Markdown, or download the files with a prompt.md for a coding agent.",
    link: { label: "Open the area chart", href: "/docs/area" },
  },
]
</script>
<template>
  <section id="directory" aria-labelledby="directory-h" class="directory">
    <div class="dir-head">
      <div class="dir-text">
        <h2 id="directory-h" class="section-title chrome-type">
          {{ SECTION_COUNT }} sections, every one of them live.
        </h2>
        <p class="dir-p">
          Each section is a working demo with its props table and its code. Every component is one file in one folder,
          so what you read is what you ship.
        </p>
        <a :href="routePath('/docs')" class="more-link">Browse all sections</a>
      </div>
      <div class="dir-chart">
        <BarChart :data="ROWS" :config="CONFIG" class="h-full">
          <Grid horizontal />
          <YAxis :tick-count="3" />
          <Bar v-for="f in FAMILIES" :key="f.title" :data-key="f.title" />
          <Tooltip label-key="docs" />
        </BarChart>
      </div>
    </div>
    <div class="hardshell window">
      <ul class="bento" aria-label="Examples from the docs">
        <li v-for="t in BENTO" :key="t.id" class="tile" :class="`t-${t.id}`">
          <div class="gel tile-art" :class="{ flush: t.id === 'meta-balls' || t.id === 'galaxy' }">
            <RadarChart
              v-if="t.id === 'radar'"
              :data="RADAR_ROWS"
              :config="RADAR_CONFIG"
              name-key="axis"
              :sparkles="false"
              class="chart"
            >
              <Radar data-key="current" />
              <Radar data-key="previous" />
              <Legend align="center" />
            </RadarChart>
            <template v-else-if="t.id === 'meta-balls'">
              <DitherMetaBalls
                :colors="BLOBS"
                :count="5"
                :frame-rate="12"
                :paused="!ballsPlaying"
                class="h-full w-full"
              />
              <PauseChip v-model="ballsPlaying" label="Pause the meta balls" class="chip" />
            </template>
            <p v-else-if="t.id === 'decrypted-text'" class="cipher">
              <DitherDecryptedText text="Every pixel," />
              <DitherDecryptedText text="on purpose." />
            </p>
            <div v-else-if="t.id === 'stats-cards'" class="stat">
              <span class="stat-d">Frames exported</span>
              <span class="stat-v">12,480</span>
              <span class="stat-d"><b>+8.2%</b> on last week</span>
              <Sparkline :data="SPARK" color="blue" class="stat-spark" />
            </div>
            <DitherRating v-else-if="t.id === 'rating'" v-model="stars" :size="28" label="Rate the kit" />
            <PieChart
              v-else-if="t.id === 'pie'"
              :data="PIE_ROWS"
              :config="PIE_CONFIG"
              data-key="value"
              name-key="name"
              :inner-radius="0.55"
              class="chart chart-sm"
            >
              <Pie variant="gradient" />
              <Legend align="center" />
            </PieChart>
            <div v-else-if="t.id === 'progress'" class="bars">
              <div class="bar-row">
                <span class="bar-l"><span>Build</span><span>72%</span></span>
                <DitherProgress :value="72" color="blue" />
              </div>
              <div class="bar-row">
                <span class="bar-l"><span>Tests</span><span>100%</span></span>
                <DitherProgress :value="100" color="green" />
              </div>
            </div>
            <template v-else-if="t.id === 'galaxy'">
              <DitherGalaxy :frame-rate="12" :paused="!galaxyPlaying" class="h-full w-full" />
              <PauseChip v-model="galaxyPlaying" label="Pause the galaxy" class="chip" />
            </template>
          </div>
          <p class="tile-foot">
            <a :href="routePath(`/docs/${t.id}`)" class="lead">{{ t.label }}</a>
            <span class="spec">{{ t.family }}</span>
          </p>
        </li>
      </ul>
      <ul class="tools" aria-label="In every preview">
        <li v-for="t in TOOLS" :key="t.title">
          <h3 class="tool-h">
            <DitherIcon :name="t.icon" :size="15" :stroke-width="1.5" class="tool-i" />{{ t.title }}
          </h3>
          <p class="tool-p">{{ t.text }}</p>
          <a :href="routePath(t.link.href)" class="lead">{{ t.link.label }}</a>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.directory {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* The head: the title, its line and its link on the left; the families'
   chart on the right, standing on the panel. One column under 760px, the
   chart under the text. */
.dir-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  align-items: end;
  gap: 20px 40px;
}

.dir-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding-bottom: 8px;
}

.dir-p {
  margin: 0;
  max-width: 34rem;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-3);
}

.dir-chart {
  height: 13rem;
}

@media (max-width: 759px) {
  .dir-head {
    grid-template-columns: minmax(0, 1fr);
  }
}

.window {
  position: relative;
  overflow: hidden;
}

/* The bento: big live tiles on a 12-column grid, three rows of mixed
   widths; two columns under 900px, one under 560px. A tile is its live
   surface in a gel well and, under it, a strip: the name (a link into the
   docs) left, the family right. */
.bento {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 22px 14px;
  padding: 16px 16px 22px;
}

.tile {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tile-art {
  flex: 1;
  display: grid;
  place-items: center;
  min-height: 13rem;
  padding: 14px;
}

.tile-art.flush {
  padding: 0;
}

.tile-foot {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin: 10px 4px 0;
}

/* Three rows on twelve columns: the radar beside the meta balls; the
   cipher, the stat card and the rating; the pie, the progress and the
   galaxy. */
.t-radar {
  grid-column: span 7;
}

.t-meta-balls,
.t-galaxy {
  grid-column: span 5;
}

.t-radar .tile-art,
.t-meta-balls .tile-art {
  min-height: 18rem;
}

.t-decrypted-text,
.t-stats-cards,
.t-rating,
.t-pie {
  grid-column: span 4;
}

.t-progress {
  grid-column: span 3;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 15rem;
}

.chart-sm {
  min-height: 11rem;
}

.chip {
  position: absolute;
  right: 12px;
  bottom: 10px;
  z-index: 4;
}

.cipher {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
  font-size: clamp(1.25rem, 2vw, 1.6rem);
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: -0.03em;
  text-align: center;
  color: var(--ink);
}

/* The stat card: a small screen of kit parts, as the examples compose. */
.stat {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.stat-v {
  font-size: 1.7rem;
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--ink);
}

.stat-d {
  font-size: 11px;
  color: var(--ink-3);
}

.stat-d b {
  font-weight: 500;
  color: var(--ink);
}

.stat-spark {
  height: 44px;
  margin-top: 6px;
}

.bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.bar-row {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.bar-l {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--ink-3);
}

@media (max-width: 899px) {
  .bento > .tile {
    grid-column: span 6;
  }
}

@media (max-width: 559px) {
  .bento {
    padding: 12px 12px 18px;
  }
  .bento > .tile {
    grid-column: span 12;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chip {
    display: none;
  }
}

/* What every preview offers: three columns under the bento, split by
   hairlines (no boxes inside the panel). */
.tools {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
  box-shadow: inset 0 1px 0 var(--line);
}

.tools li {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 18px 20px 20px;
}

.tools li + li {
  box-shadow: inset 1px 0 0 var(--line);
}

.tool-h {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
}

.tool-i {
  flex: none;
  color: var(--ink-3);
}

.tool-p {
  margin: 0 0 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-3);
  text-wrap: pretty;
}

@media (max-width: 759px) {
  .tools {
    grid-template-columns: minmax(0, 1fr);
  }
  .tools li + li {
    box-shadow: inset 0 1px 0 var(--line);
  }
}
</style>
