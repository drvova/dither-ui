<script setup lang="ts">
// "Every component, live.": the title beside a line and the docs link, then
// a bento of live kit components, row by row (`BENTO`), each a card of its
// art over its name. The name leads into the docs section; the art is the
// component itself, hands on, in the kit's blue with the ember for a second
// voice. Everything that moves has its pause.
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, reactive, ref } from "vue"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  DitherAvatar,
  DitherButton,
  DitherDecryptedText,
  DitherHoldAction,
  DitherMetaBalls,
  DitherProgress,
  DitherRating,
  DitherSilk,
  DitherSlideAction,
  DitherSlider,
  DitherWorld,
  Legend,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  Sparkline,
  XAxis,
  cssColor,
  sampleWorld,
  type ButtonVariant,
  type DitherColor,
} from "@dither-kit"
import { routePath } from "@/shared/lib"
import { COMPONENT_COUNT } from "./facts"
import { BENTO } from "./hub"
import PauseChip from "./PauseChip.vue"

// The heavy cards are their own chunks, fetched as the card nears the
// viewport: the shader's WebGL engine, the translator's utility map, the
// fluid's canvas engine.
const DitherShader = defineAsyncComponent(() => import("@dither-kit/tailwind/DitherShader.vue"))
const ExportScene = defineAsyncComponent(() => import("./ExportScene.vue"))
const DitherFerrofluid = defineAsyncComponent(() => import("@dither-kit/tailwind/Ferrofluid.vue"))
const LAZY = new Set(["shader", "styling", "ferrofluid"])
const near = reactive(new Set<string>())
const bento = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null
onMounted(() => {
  const cards = [...(bento.value?.querySelectorAll<HTMLElement>("[data-lazy]") ?? [])]
  if (typeof IntersectionObserver === "undefined") return cards.forEach((c) => near.add(c.dataset.lazy ?? ""))
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries)
        if (e.isIntersecting) {
          near.add((e.target as HTMLElement).dataset.lazy ?? "")
          io?.unobserve(e.target)
        }
    },
    { rootMargin: "600px 0px" },
  )
  for (const c of cards) io.observe(c)
})
onBeforeUnmount(() => io?.disconnect())

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

// Area chart: one seed sets every fill; roll it and every fill changes.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const REVENUE = [42, 51, 48, 63, 71, 68, 79, 86, 82, 94, 102, 118]
const EXPENSES = [31, 34, 33, 39, 44, 47, 46, 52, 55, 58, 61, 67]
const AREA_ROWS = MONTHS.map((month, i) => ({ month, revenue: REVENUE[i], expenses: EXPENSES[i] }))
const AREA_CONFIG = {
  revenue: { label: "Revenue", color: "blue" as DitherColor },
  expenses: { label: "Expenses", color: "grey" as DitherColor },
}
const fills = ref(1984)
const roll = () => (fills.value = Math.floor(Math.random() * 1_000_000))

// Button: four fills, five hues.
const FILLS: ButtonVariant[] = ["gradient", "dotted", "hatched", "solid"]
const HUES: DitherColor[] = ["blue", "orange", "green", "purple", "pink"]
const btn = reactive({ variant: "gradient" as ButtonVariant, color: "blue" as DitherColor })

// Shader: the kit's seeded sample (every seed a different GLSL program),
// 1-bit in the kit's blue, on a palette ramp, or in its own colours.
const OUTPUTS = ["mono", "ramp", "colour"] as const
const output = ref<(typeof OUTPUTS)[number]>("mono")
const program = ref(3)
const SHADER_RAMP: DitherColor[] = ["blue", "purple", "pink", "orange"]
const shaderPlaying = ref(true)

// Ferrofluid: the kit's blue, the ember, or the page's grey.
const FLUIDS = {
  blue: ["#2f6fd0", "#7ba3ee", "#c9dbff"],
  ember: ["#a84d17", "#f08a3c", "#ffd9b0"],
  grey: ["#25292d", "#5d6268", "#a6abb1"],
} as const
type Fluid = keyof typeof FLUIDS
const FLUID_NAMES = Object.keys(FLUIDS) as Fluid[]
const fluid = ref<Fluid>("blue")
const fluidPlaying = ref(true)

// Slide action: deploys confirmed.
const deploys = ref(0)

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

    <ul ref="bento" class="bento" aria-label="Examples from the docs">
      <li
        v-for="t in BENTO"
        :key="t.id"
        class="card"
        :class="`t-${t.id}`"
        :data-lazy="LAZY.has(t.id) ? t.id : undefined"
      >
        <div
          class="card-art"
          :class="{ flush: ['world', 'meta-balls', 'silk', 'shader', 'ferrofluid', 'styling'].includes(t.id) }"
        >
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

          <div v-else-if="t.id === 'area'" class="panel">
            <AreaChart :key="fills" :data="AREA_ROWS" :config="AREA_CONFIG" :seed="fills" class="area-chart">
              <XAxis data-key="month" :max-ticks="6" />
              <Area data-key="expenses" :variant="fills + 1" />
              <Area data-key="revenue" :variant="fills" />
            </AreaChart>
            <div class="row">
              <button type="button" class="key" @click="roll">Roll a seed</button>
              <span class="readout">seed {{ fills }}</span>
            </div>
          </div>

          <div v-else-if="t.id === 'button'" class="stack">
            <DitherButton :color="btn.color" :variant="btn.variant" class="min-h-12 px-8 text-sm">Deploy</DitherButton>
            <div class="seg" role="group" aria-label="Fill">
              <button
                v-for="v in FILLS"
                :key="v"
                type="button"
                :aria-pressed="btn.variant === v"
                @click="btn.variant = v"
              >
                {{ v }}
              </button>
            </div>
            <div class="swatches" role="group" aria-label="Hue">
              <button
                v-for="c in HUES"
                :key="c"
                type="button"
                class="swatch"
                :aria-label="c"
                :aria-pressed="btn.color === c"
                :style="{ backgroundColor: cssColor(c) }"
                @click="btn.color = c"
              />
            </div>
          </div>

          <template v-else-if="t.id === 'shader'">
            <div>
              <DitherShader
                v-if="near.has('shader')"
                :seed="program"
                :mono="output === 'mono'"
                :colors="output === 'ramp' ? SHADER_RAMP : undefined"
                color="blue"
                :cell="4"
                :paused="!shaderPlaying"
                :label="`The kit's sample shader, seed ${program}`"
                class="h-full w-full"
              />
            </div>
            <PauseChip v-model="shaderPlaying" label="Pause the shader" class="chip" />
            <div class="art-tools">
              <div class="seg" role="group" aria-label="Shader output">
                <button v-for="m in OUTPUTS" :key="m" type="button" :aria-pressed="output === m" @click="output = m">
                  {{ m }}
                </button>
              </div>
              <button type="button" class="key" @click="program++">New shader</button>
            </div>
          </template>

          <template v-else-if="t.id === 'ferrofluid'">
            <div>
              <DitherFerrofluid
                v-if="near.has('ferrofluid')"
                :colors="[...FLUIDS[fluid]]"
                :paused="!fluidPlaying"
                class="h-full w-full"
              />
            </div>
            <PauseChip v-model="fluidPlaying" label="Pause the fluid" class="chip" />
            <div class="art-tools">
              <div class="seg" role="group" aria-label="Fluid palette">
                <button v-for="f in FLUID_NAMES" :key="f" type="button" :aria-pressed="fluid === f" @click="fluid = f">
                  {{ f }}
                </button>
              </div>
            </div>
          </template>

          <div v-else-if="t.id === 'styling'">
            <ExportScene v-if="near.has('styling')" />
          </div>

          <div v-else-if="t.id === 'slide-action'" class="stack">
            <DitherSlideAction label="Slide to deploy" color="blue" class="w-full max-w-80" @confirm="deploys++" />
            <span class="readout">deploys {{ deploys }}</span>
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
   stacked (4); a wide card (8) beside a third; three thirds; two halves; a
   wide card beside a third; two halves; three thirds; two halves. Two
   columns under 1024px (the wide cards and the halves take both, the rest
   pack densely), one under 640px. */
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

.t-area,
.t-styling {
  grid-column: span 8;
}

.t-bar,
.t-meta-balls,
.t-silk,
.t-decrypted-text,
.t-shader,
.t-ferrofluid {
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
.t-decrypted-text .card-art,
.t-area .card-art,
.t-button .card-art,
.t-shader .card-art,
.t-ferrofluid .card-art,
.t-styling .card-art,
.t-slide-action .card-art {
  height: 300px;
}

/* The export card answers to its own width: its code alone when narrow. */
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
.t-hold-action .stack,
.t-button .stack,
.t-slide-action .stack {
  justify-content: center;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.area-chart {
  flex: 1;
  min-height: 0;
}

.swatches {
  display: flex;
  gap: 8px;
}

.swatch {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.swatch[aria-pressed="true"] {
  box-shadow:
    0 0 0 2px var(--card),
    0 0 0 3px var(--ink);
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
  .t-area,
  .t-styling,
  .t-bar,
  .t-meta-balls,
  .t-silk,
  .t-decrypted-text,
  .t-shader,
  .t-ferrofluid {
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
  .t-area,
  .t-styling,
  .t-bar,
  .t-meta-balls,
  .t-silk,
  .t-decrypted-text,
  .t-shader,
  .t-ferrofluid {
    grid-column: auto;
  }
  .t-world .card-art {
    min-height: 320px;
  }
}
</style>
