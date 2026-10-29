<script setup lang="ts">
// "Every component, live.": the title beside a line and the docs link, then
// a bento of live kit components the hero's stage does not show, row by row
// (`BENTO`), each a card of its art over its name. The name leads into the
// docs section; the art is the component itself, hands on, in the kit's
// blue with the ember for a second voice. Everything that moves has its
// pause.
import { computed, ref } from "vue"
import {
  Bar,
  BarChart,
  DitherAvatar,
  DitherDecryptedText,
  DitherHoldAction,
  DitherMetaBalls,
  DitherProgress,
  DitherRating,
  DitherSilk,
  DitherSlider,
  DitherWorld,
  Legend,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  Sparkline,
  XAxis,
  sampleWorld,
  type DitherColor,
} from "@dither-kit"
import { routePath } from "@/shared/lib"
import { COMPONENT_COUNT } from "./facts"
import { BENTO } from "./hub"
import PauseChip from "./PauseChip.vue"

// 3D model: a seeded probe on a picked ramp; "New model" is the next seed.
const BLUE = ["#0c1730", "#1e429f", "#2f6fd0", "#7ba3ee", "#c9dbff"]
const RAMPS = {
  blue: BLUE,
  metal: ["#101214", "#25292d", "#5d6268", "#a6abb1", "#e4e1d8"],
  ember: ["#170b04", "#4f240b", "#a84d17", "#f08a3c", "#ffd9b0"],
}
type Ramp = keyof typeof RAMPS
const RAMP_NAMES = Object.keys(RAMPS) as Ramp[]
const ramp = ref<Ramp>("blue")
const model = ref(7)
const world = computed(() => sampleWorld(model.value))
const worldPlaying = ref(true)

// Rating.
const stars = ref(4)

// Stat card.
const SPARK = [12, 14, 13, 17, 16, 19, 18, 22, 21, 24, 23, 27, 26, 29, 31, 30, 33, 35]

// Bar chart: deploys a week, the last week the tallest.
const WEEKS = [38, 44, 41, 52, 47, 58, 55, 63, 49, 61, 68, 74].map((deploys, i) => ({ week: `W${27 + i}`, deploys }))
const BAR_CONFIG = { deploys: { label: "Deploys", color: "blue" as DitherColor } }

// Meta balls.
const BLOBS = ["#2f6fd0", "#7ba3ee", "#c9dbff"]
const ballsPlaying = ref(true)

// Slider: a dither's settings, each with its value.
const cellSize = ref(4)
const contrast = ref(62)

// Pie chart.
const PIE_ROWS = [
  { name: "Vue", value: 58 },
  { name: "Svelte", value: 27 },
  { name: "Other", value: 15 },
]
const PIE_CONFIG = {
  Vue: { label: "Vue", color: "blue" as DitherColor },
  Svelte: { label: "Svelte", color: "orange" as DitherColor },
  Other: { label: "Other", color: "grey" as DitherColor },
}

// Avatar: one seeded face from each name.
const TEAM = ["Ada Byte", "Rei Toma", "Ola Nord", "Kit Vale", "Ines Roa", "Teo Park"]

// Silk, in the kit's blue.
const SILK = [BLUE[2], BLUE[4], BLUE[2]]
const silkPlaying = ref(true)

// Radar chart.
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

// Progress: a deploy, step by step.
const STEPS = [
  { label: "Install", value: 100, color: "blue" as DitherColor },
  { label: "Build", value: 72, color: "blue" as DitherColor },
  { label: "Upload", value: 28, color: "blue" as DitherColor },
]

// Hold action: caches purged.
const purged = ref(0)
</script>

<template>
  <section id="examples" aria-labelledby="examples-h" class="examples">
    <div class="sec-head">
      <h2 id="examples-h" class="section-title chrome-type">Every component, live.</h2>
      <div class="sec-side">
        <p class="sec-lede">
          {{ COMPONENT_COUNT }} components on one engine, each live in its docs section with its props and its code.
          Copy one as it is, or have your agent change it.
        </p>
        <a :href="routePath('/docs')" class="more-link">See every section in the docs</a>
      </div>
    </div>

    <ul class="bento" aria-label="Examples from the docs">
      <li v-for="t in BENTO" :key="t.id" class="card" :class="`t-${t.id}`">
        <div class="card-art" :class="{ flush: ['world', 'meta-balls', 'silk'].includes(t.id) }">
          <template v-if="t.id === 'world'">
            <DitherWorld
              :source="world"
              :colors="RAMPS[ramp]"
              :auto-rotate="worldPlaying ? 14 : 0"
              :grain="0.4"
              :frame-rate="12"
              :label="`A seeded 3D probe, model ${model}, turning slowly through the kit's Bayer cells`"
              class="h-full w-full"
            />
            <PauseChip v-model="worldPlaying" label="Pause the model" class="chip" />
            <div class="art-tools">
              <div class="seg" role="group" aria-label="Model ramp">
                <button v-for="r in RAMP_NAMES" :key="r" type="button" :aria-pressed="ramp === r" @click="ramp = r">
                  {{ r }}
                </button>
              </div>
              <button type="button" class="key" @click="model++">New model</button>
            </div>
          </template>

          <div v-else-if="t.id === 'rating'" class="stack">
            <DitherRating v-model="stars" :size="30" label="Rate the kit" />
            <span class="readout">{{ stars }} of 5</span>
          </div>

          <div v-else-if="t.id === 'stats-cards'" class="panel stat">
            <span class="panel-d">Frames exported</span>
            <span class="stat-v">12,480</span>
            <span class="panel-d"><b>+8.2%</b> on last week</span>
            <Sparkline :data="SPARK" color="blue" class="stat-spark" />
          </div>

          <div v-else-if="t.id === 'bar'" class="panel bars">
            <div class="panel-top">
              <span class="panel-d">Deploys to production</span>
              <span class="panel-d"><b>+8.8%</b> on last week</span>
            </div>
            <span class="stat-v">74</span>
            <BarChart :data="WEEKS" :config="BAR_CONFIG" class="bar-chart">
              <XAxis data-key="week" :max-ticks="6" />
              <Bar data-key="deploys" />
            </BarChart>
          </div>

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

          <div v-else-if="t.id === 'slider'" class="panel steps">
            <span class="panel-h">Dither settings</span>
            <div class="step">
              <span class="step-l"
                ><span>Cell size</span><span>{{ cellSize }}px</span></span
              >
              <DitherSlider v-model="cellSize" :min="1" :max="8" label="Cell size" ticks class="w-full" />
            </div>
            <div class="step">
              <span class="step-l"
                ><span>Contrast</span><span>{{ contrast }}%</span></span
              >
              <DitherSlider v-model="contrast" :min="0" :max="100" label="Contrast" color="blue" class="w-full" />
            </div>
          </div>

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

          <div v-else-if="t.id === 'avatar'" class="people">
            <div class="who">
              <DitherAvatar name="Ada Lovelace" color="blue" :size="56" />
              <span class="who-n">Ada Lovelace</span>
              <span class="who-s"><i class="led" aria-hidden="true"></i>Online</span>
            </div>
            <ul class="team" aria-label="Team">
              <li v-for="n in TEAM" :key="n">
                <DitherAvatar :name="n" color="blue" :size="28" /><span class="sr-only">{{ n }}</span>
              </li>
            </ul>
          </div>

          <template v-else-if="t.id === 'silk'">
            <DitherSilk :colors="SILK" :frame-rate="12" :paused="!silkPlaying" class="h-full w-full" />
            <PauseChip v-model="silkPlaying" label="Pause the silk" class="chip" />
          </template>

          <p v-else-if="t.id === 'decrypted-text'" class="cipher">
            <DitherDecryptedText text="Every pixel," />
            <DitherDecryptedText text="on purpose." />
          </p>

          <div v-else-if="t.id === 'progress'" class="panel steps">
            <span class="panel-h">Deploying web</span>
            <div v-for="s in STEPS" :key="s.label" class="step">
              <span class="step-l"
                ><span>{{ s.label }}</span
                ><span>{{ s.value }}%</span></span
              >
              <DitherProgress :value="s.value" :color="s.color" :aria-label="s.label" />
            </div>
          </div>

          <RadarChart
            v-else-if="t.id === 'radar'"
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

          <div v-else-if="t.id === 'hold-action'" class="stack">
            <DitherHoldAction color="orange" @complete="purged++">Hold to purge cache</DitherHoldAction>
            <span class="readout">purged {{ purged }}</span>
          </div>
        </div>
        <p class="card-foot">
          <a :href="routePath(`/docs/${t.id}`)" class="card-name">{{ t.label }}</a>
        </p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.examples {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* The bento: twelve columns, row by row: a tall lead card (8) beside two
   stacked (4); two halves; three thirds;
   two halves; three thirds. Two columns under 1024px (the wide cards
   take both, the rest pack densely), one under 640px. */
.bento {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* A card: the raised ground, no border. Its art hands its keys and picked
   segments the page's ground, so they stay shapes on it. */
.card {
  --card: var(--surface);
  grid-column: span 4;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border-radius: 20px;
  background: var(--card);
}

.t-world {
  grid-column: span 8;
  grid-row: span 2;
}

.t-bar,
.t-meta-balls,
.t-silk,
.t-decrypted-text {
  grid-column: span 6;
}

.card-art {
  --surface: var(--background);
  position: relative;
  display: grid;
  place-items: center;
  height: 260px;
  padding: 24px;
  min-width: 0;
}

.t-world .card-art {
  flex: 1;
  height: auto;
  min-height: 420px;
}

.t-rating .card-art,
.t-stats-cards .card-art {
  height: 220px;
  padding: 18px 20px;
}

.t-bar .card-art,
.t-meta-balls .card-art,
.t-silk .card-art,
.t-decrypted-text .card-art {
  height: 300px;
}

.card-art.flush {
  padding: 0;
}

.card-art.flush > :first-child {
  position: absolute;
  inset: 0;
}

/* The footer: the name, the docs link. */
.card-foot {
  display: flex;
  align-items: center;
  min-height: 48px;
  margin: 0;
  padding: 0 20px 4px;
}

.card-name {
  margin-block: -4px;
  padding-block: 4px;
  font-size: 13px;
  color: var(--ink);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
  text-decoration-color: transparent;
  transition: text-decoration-color 150ms var(--ease-settle);
}

.card-name:hover,
.card:hover .card-name {
  text-decoration-color: currentColor;
}

/* Over the flush art: the model's tools along its foot, a pause chip at
   the top right. */
.art-tools {
  position: absolute;
  left: 16px;
  bottom: 16px;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.art-tools .seg {
  padding: 2px;
  border-radius: 10px;
  background: var(--card);
}

.chip {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
}

.stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 100%;
  height: 100%;
}

.t-rating .stack,
.t-hold-action .stack {
  justify-content: center;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.readout {
  font-size: 11px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.chart-sm {
  max-width: 260px;
}

/* A small app panel: a label line, a big figure, then its chart. */
.panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  height: 100%;
}

.panel-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.panel-d {
  font-size: 11.5px;
  color: var(--ink-3);
}

.panel-d b {
  font-weight: 500;
  color: var(--ink);
}

.panel-h {
  font-size: 13px;
  color: var(--ink);
}

.stat {
  justify-content: center;
}

.stat-v {
  font-size: 1.9rem;
  font-weight: 500;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

.stat-spark {
  height: 56px;
  margin-top: 8px;
}

.bar-chart {
  flex: 1;
  min-height: 0;
  margin-top: 6px;
}

.people {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.who {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.who-n {
  font-size: 12px;
  color: var(--ink);
}

.who-s {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--ink-3);
}

.team {
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cipher {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
  font-family: var(--display-face);
  font-size: clamp(1.6rem, 3vw, 2.4rem);
  line-height: 1.15;
  text-align: center;
  color: var(--ink);
}

.steps {
  justify-content: center;
  gap: 14px;
}

.step {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.step-l {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1023px) {
  .bento {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-flow: row dense;
  }
  .card {
    grid-column: span 1;
  }
  .t-world,
  .t-bar,
  .t-meta-balls,
  .t-silk,
  .t-decrypted-text {
    grid-column: span 2;
    grid-row: auto;
  }
  .t-world .card-art {
    min-height: 360px;
  }
}

@media (max-width: 639px) {
  .bento {
    grid-template-columns: minmax(0, 1fr);
  }
  .t-world,
  .t-bar,
  .t-meta-balls,
  .t-silk,
  .t-decrypted-text {
    grid-column: auto;
  }
  .t-world .card-art {
    min-height: 320px;
  }
}
</style>
