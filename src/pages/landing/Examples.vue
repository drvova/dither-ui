<script setup lang="ts">
// "Every component, live." (laid out after dithercn.dev): the title beside a line and
// the docs link, then a bento of live kit components, row by row (`BENTO`),
// each a card of its art over a footer naming it and its docs family. The
// name leads into the docs section; the art is the component itself, hands
// on. Everything that moves has its pause.
import { defineAsyncComponent, ref } from "vue"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  DitherAvatar,
  DitherButton,
  DitherDecryptedText,
  DitherProgress,
  DitherSilk,
  DitherWorld,
  Grid,
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

// The heavy cards are their own chunks: the shader's WebGL engine and the
// code translator's utility map.
const DitherShader = defineAsyncComponent(() => import("@dither-kit/tailwind/DitherShader.vue"))
const ExportScene = defineAsyncComponent(() => import("./ExportScene.vue"))

// Shader: the kit's seeded sample (every seed a different GLSL program) on
// a palette ramp, 1-bit, or in its own colours.
const MODES = ["ramp", "mono", "colour"] as const
const mode = ref<(typeof MODES)[number]>("ramp")
const program = ref(3)
const shaderPlaying = ref(true)
const SHADER_RAMP: DitherColor[] = ["blue", "purple", "pink", "orange"]

// Area chart: one seed for every fill; roll it.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const AREA_ROWS = MONTHS.map((month, i) => ({
  month,
  revenue: [42, 51, 48, 63, 71, 68, 79, 86, 82, 94, 102, 118][i],
  expenses: [31, 34, 33, 39, 44, 47, 46, 52, 55, 58, 61, 67][i],
}))
const AREA_CONFIG = {
  revenue: { label: "Revenue", color: "blue" as DitherColor },
  expenses: { label: "Expenses", color: "purple" as DitherColor },
}
const seed = ref(1984)
const roll = () => (seed.value = Math.floor(Math.random() * 1_000_000))

// Stat card.
const SPARK = [12, 14, 13, 17, 16, 19, 18, 22, 21, 24, 23, 27, 26, 29, 31, 30, 33, 35]

// Bar chart: deploys a week, the last week the tallest.
const WEEKS = [38, 44, 41, 52, 47, 58, 55, 63, 49, 61, 68, 74].map((deploys, i) => ({ week: `W${27 + i}`, deploys }))
const BAR_CONFIG = { deploys: { label: "Deploys", color: "blue" as DitherColor } }

// 3D model: the house ramp on a seeded probe.
const WORLD = sampleWorld(7)
const WORLD_RAMP = ["#0c1730", "#1e429f", "#2f6fd0", "#7ba3ee", "#c9dbff"]
const worldPlaying = ref(true)

// Pie chart.
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

// Avatar: one seeded face from each name.
const TEAM = ["Ada Byte", "Rei Toma", "Ola Nord", "Kit Vale", "Ines Roa", "Teo Park"]

// Silk.
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
  { label: "Install", value: 100, color: "green" as DitherColor },
  { label: "Build", value: 72, color: "blue" as DitherColor },
  { label: "Upload", value: 28, color: "blue" as DitherColor },
]

// Dither button: deploys taken.
const deploys = ref(0)
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
        <div class="card-art" :class="{ flush: ['shader', 'world', 'silk'].includes(t.id) }">
          <template v-if="t.id === 'shader'">
            <DitherShader
              :seed="program"
              :mono="mode === 'mono'"
              :colors="mode === 'ramp' ? SHADER_RAMP : undefined"
              color="blue"
              :cell="4"
              :paused="!shaderPlaying"
              interactive
              :label="`The kit's sample shader, seed ${program}`"
              class="h-full w-full"
            />
            <div class="art-tools">
              <div class="seg track" role="group" aria-label="Shader output">
                <button v-for="m in MODES" :key="m" type="button" :aria-pressed="mode === m" @click="mode = m">
                  {{ m }}
                </button>
              </div>
              <button type="button" class="nav-a nav-pill tool-key" @click="program++">New shader</button>
            </div>
            <PauseChip v-model="shaderPlaying" label="Pause the shader" class="chip" />
          </template>

          <div v-else-if="t.id === 'area'" class="stack">
            <div class="chart">
              <AreaChart :key="seed" :data="AREA_ROWS" :config="AREA_CONFIG" :seed="seed" class="h-full">
                <XAxis data-key="month" :max-ticks="4" />
                <Area data-key="expenses" :variant="seed + 1" />
                <Area data-key="revenue" :variant="seed" />
              </AreaChart>
            </div>
            <div class="row">
              <DitherButton color="blue" variant="gradient" class="min-h-8 px-3" @click="roll"
                >Roll a seed</DitherButton
              >
              <span class="readout">seed {{ seed }}</span>
            </div>
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
              <Grid horizontal />
              <XAxis data-key="week" :max-ticks="6" />
              <Bar data-key="deploys" />
            </BarChart>
          </div>

          <ExportScene v-else-if="t.id === 'styling'" />

          <template v-else-if="t.id === 'world'">
            <DitherWorld
              :source="WORLD"
              :colors="WORLD_RAMP"
              :auto-rotate="worldPlaying ? 14 : 0"
              :grain="0.4"
              :frame-rate="12"
              label="A seeded 3D probe turning slowly, rendered through the kit's Bayer cells"
              class="h-full w-full"
            />
            <PauseChip v-model="worldPlaying" label="Pause the model" class="chip" />
          </template>

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
              <DitherAvatar name="Ada Lovelace" :size="56" />
              <span class="who-n">Ada Lovelace</span>
              <span class="who-s"><i class="led" aria-hidden="true"></i>Online</span>
            </div>
            <ul class="team" aria-label="Team">
              <li v-for="n in TEAM" :key="n">
                <DitherAvatar :name="n" :size="28" /><span class="sr-only">{{ n }}</span>
              </li>
            </ul>
          </div>

          <template v-else-if="t.id === 'silk'">
            <DitherSilk :frame-rate="12" :paused="!silkPlaying" class="h-full w-full" />
            <PauseChip v-model="silkPlaying" label="Pause the silk" class="chip" />
          </template>

          <p v-else-if="t.id === 'decrypted-text'" class="cipher">
            <DitherDecryptedText text="Every pixel," />
            <DitherDecryptedText text="on purpose." />
          </p>

          <div v-else-if="t.id === 'progress'" class="panel steps">
            <div class="panel-top">
              <span class="panel-h">Deploying web</span>
              <span class="panel-d">4f2a1c9</span>
            </div>
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

          <div v-else-if="t.id === 'button'" class="stack">
            <div class="row">
              <DitherButton color="blue" variant="gradient" @click="deploys++">Deploy</DitherButton>
              <DitherButton color="grey" variant="dotted">View logs</DitherButton>
            </div>
            <span class="readout">deploys {{ deploys }}</span>
          </div>
        </div>
        <p class="card-foot">
          <a :href="routePath(`/docs/${t.id}`)" class="card-name">{{ t.label }}</a>
          <span class="spec">{{ t.family }}</span>
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

/* The bento: twelve columns, row by row as dithercn.dev lays its own: a
   tall lead card (8) beside two stacked (4); two halves; three thirds;
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

.card {
  grid-column: span 4;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--shell-ground), color-mix(in oklab, var(--background) 94%, #a6abb1);
  transition: border-color 160ms var(--ease-settle);
}

.card:hover,
.card:focus-within {
  border-color: color-mix(in oklab, var(--foreground) 22%, transparent);
}

.t-shader {
  grid-column: span 8;
  grid-row: span 2;
}

.t-bar,
.t-styling,
.t-silk,
.t-decrypted-text {
  grid-column: span 6;
}

.card-art {
  position: relative;
  display: grid;
  place-items: center;
  height: 260px;
  padding: 24px;
  min-width: 0;
}

.t-shader .card-art {
  flex: 1;
  height: auto;
  min-height: 420px;
}

.t-area .card-art,
.t-stats-cards .card-art {
  height: 220px;
  padding: 18px 20px;
}

.t-bar .card-art,
.t-styling .card-art,
.t-silk .card-art,
.t-decrypted-text .card-art {
  height: 300px;
}

.t-styling .card-art {
  container-type: inline-size;
}

.card-art.flush {
  padding: 0;
}

.card-art.flush > :first-child {
  position: absolute;
  inset: 0;
}

/* The footer: the name (the docs link) and the family. */
.card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  margin: 0;
  padding: 0 20px;
  border-top: 1px solid var(--line);
  background: color-mix(in oklab, var(--background) 55%, transparent);
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
  text-decoration-color: color-mix(in oklab, var(--ink-3) 70%, transparent);
}

/* Over the flush art: the shader's tools along its foot, a pause chip at
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

.art-tools .track {
  background: color-mix(in oklab, var(--background) 82%, transparent);
}

.tool-key {
  height: 32px;
  padding-inline: 12px;
  background: color-mix(in oklab, var(--background) 82%, transparent);
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

.t-area .stack {
  justify-content: space-between;
}

.t-button .stack {
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

.t-area .chart {
  height: 132px;
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
  letter-spacing: -0.03em;
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
  .t-shader,
  .t-bar,
  .t-styling,
  .t-silk,
  .t-decrypted-text {
    grid-column: span 2;
    grid-row: auto;
  }
  .t-shader .card-art {
    min-height: 360px;
  }
}

@media (max-width: 639px) {
  .bento {
    grid-template-columns: minmax(0, 1fr);
  }
  .t-shader,
  .t-bar,
  .t-styling,
  .t-silk,
  .t-decrypted-text {
    grid-column: auto;
  }
  .t-shader .card-art {
    min-height: 320px;
  }
  .t-styling .card-art {
    height: 340px;
  }
}
</style>
