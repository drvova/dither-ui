<script setup lang="ts">
// The hero's stage: the kit by hand, one real component at a time, the way
// the film shows it (each framed alone on the stage with the controls its
// docs demo has), leading with what nothing else does: a dithered chart, a
// GLSL shader, one snippet written as StyleX. The picker under the stage
// chooses a scene and the tour moves on by itself: a CSS animation on an
// unseen clock element whose end advances it (no timer), paused while the
// stage is hovered or holds focus. The chip pauses it; using a scene or picking one
// stops it there; under reduced motion it starts paused. A new scene
// dissolves in through the kit's own ordered dither (`DitherReveal`); the
// first one is simply there, and it is the only one in the static page.
// The stage is seated on a poster: the kit's blue, its ember and the page's
// ink printed as tone through the Bayer screen, the kit's diamond knocked
// out of them (one still frame, so nothing moves there), rising past the
// stage's top and running to the frame.
import { defineAsyncComponent, onMounted, reactive, ref } from "vue"
import {
  Area,
  AreaChart,
  DitherButton,
  DitherPoster,
  DitherReveal,
  DitherSlideAction,
  XAxis,
  cssColor,
  type ButtonVariant,
  type DitherColor,
  type PixelColor,
} from "@dither-kit"
import { routePath } from "@/shared/lib"
import PauseChip from "./PauseChip.vue"

// The heavy scenes are their own chunks, fetched when first shown: the
// shader's WebGL engine, the code translator's utility map, the fluid's
// canvas engine.
const DitherShader = defineAsyncComponent(() => import("@dither-kit/tailwind/DitherShader.vue"))
const ExportScene = defineAsyncComponent(() => import("./ExportScene.vue"))
const DitherFerrofluid = defineAsyncComponent(() => import("@dither-kit/tailwind/Ferrofluid.vue"))

type Scene = { id: string; short: string; line: string; docs: string; link: string }
const SCENES: Scene[] = [
  {
    id: "chart",
    short: "Chart",
    line: "A dithered chart from one seed. Roll it and every fill changes with it.",
    docs: "/docs/seeds",
    link: "Seeds docs",
  },
  {
    id: "shader",
    short: "Shader",
    line: "Real GLSL on your GPU, read back and dithered on the kit's cells.",
    docs: "/docs/shader",
    link: "Shader docs",
  },
  {
    id: "export",
    short: "StyleX",
    line: "One snippet, written as StyleX, CSS Modules, CSS or Tailwind from the same look.",
    docs: "/docs/styling",
    link: "Styling docs",
  },
  {
    id: "button",
    short: "Button",
    line: "Four fills and five hues from one engine. Pick one.",
    docs: "/docs/button",
    link: "Button docs",
  },
  {
    id: "slide",
    short: "Slide",
    line: "Drag the thumb to the end, or focus it and press Enter.",
    docs: "/docs/slide-action",
    link: "Slide action docs",
  },
  {
    id: "ferrofluid",
    short: "Fluid",
    line: "A fluid surface that parts around the cursor.",
    docs: "/docs/ferrofluid",
    link: "Ferrofluid docs",
  },
]

// The poster's inks: the kit's blue, the ember and the page's own ink.
const INKS: PixelColor[] = ["blue", "orange", "#101214"]

const at = ref(0)
// Until the scene first changes, it is simply there: no entrance.
const moved = ref(false)
const playing = ref(true)

function show(i: number) {
  at.value = (i + SCENES.length) % SCENES.length
  moved.value = true
}
// A picked scene stays: the visitor chose it.
function pick(i: number) {
  playing.value = false
  if (i !== at.value) show(i)
}
// So does one the visitor is using (Tab only passes through it).
function hold(e: Event) {
  if (!(e instanceof KeyboardEvent && e.key === "Tab")) playing.value = false
}

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) playing.value = false
})

// Each scene's own state, as in its docs demo.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const REVENUE = [42, 51, 48, 63, 71, 68, 79, 86, 82, 94, 102, 118]
const EXPENSES = [31, 34, 33, 39, 44, 47, 46, 52, 55, 58, 61, 67]
const ROWS = MONTHS.map((month, i) => ({ month, revenue: REVENUE[i], expenses: EXPENSES[i] }))
const CHART = {
  revenue: { label: "Revenue", color: "blue" as DitherColor },
  expenses: { label: "Expenses", color: "grey" as DitherColor },
}
const seed = ref(1984)
const roll = () => (seed.value = Math.floor(Math.random() * 1_000_000))
// The shader: the kit's seeded sample (every seed is a different GLSL
// program), 1-bit in the kit's blue, on a palette ramp, or in its own colours.
const MODES = ["mono", "ramp", "colour"] as const
type Mode = (typeof MODES)[number]
const mode = ref<Mode>("mono")
const program = ref(3)
const RAMP: DitherColor[] = ["blue", "purple", "pink", "orange"]
const VARIANTS: ButtonVariant[] = ["gradient", "dotted", "hatched", "solid"]
const COLORS: DitherColor[] = ["blue", "green", "purple", "pink", "orange"]
const btn = reactive({ variant: "gradient" as ButtonVariant, color: "blue" as DitherColor })
const deploys = ref(0)
const FLUIDS = {
  acid: ["#27FF64", "#7CFF67", "#A8FFB6"],
  ice: ["#3DA5FF", "#7CE0FF", "#CFF6FF"],
  mono: ["#A8FFB6"],
} as const
type Fluid = keyof typeof FLUIDS
const FLUID_NAMES = Object.keys(FLUIDS) as Fluid[]
const fluid = ref<Fluid>("acid")
</script>

<template>
  <figure class="hero-stage">
    <div class="seat">
      <div class="seat-art" aria-hidden="true">
        <DitherPoster :seed="12" :inks="INKS" :cell="3" render-mode="static" />
      </div>
      <div class="stage" @pointerdown="hold" @keydown="hold">
        <PauseChip
          v-model="playing"
          label="Pause the component tour"
          class="stage-chip"
          @pointerdown.stop
          @keydown.stop
        />
        <DitherReveal :key="at" :progress="moved ? undefined : 1" :duration="0.6" :cell="6" class="scene-wrap">
          <div v-if="SCENES[at].id === 'chart'" class="scene scene-chart">
            <div class="chart">
              <AreaChart :key="seed" :data="ROWS" :config="CHART" :seed="seed" class="h-full">
                <XAxis data-key="month" :max-ticks="6" />
                <Area data-key="expenses" :variant="seed + 1" />
                <Area data-key="revenue" :variant="seed" />
              </AreaChart>
            </div>
            <div class="row">
              <DitherButton color="blue" variant="gradient" @click="roll">Roll a seed</DitherButton>
              <span class="count">seed: {{ seed }}</span>
            </div>
          </div>
          <div v-else-if="SCENES[at].id === 'shader'" class="scene scene-fill">
            <DitherShader
              :seed="program"
              :mono="mode === 'mono'"
              :colors="mode === 'ramp' ? RAMP : undefined"
              color="blue"
              :cell="4"
              interactive
              :label="`The kit's sample shader, seed ${program}`"
              class="fluid"
            />
            <div class="fluid-pick">
              <div class="seg" role="group" aria-label="Output">
                <button v-for="m in MODES" :key="m" type="button" :aria-pressed="mode === m" @click="mode = m">
                  {{ m }}
                </button>
              </div>
              <button type="button" class="new-program" @click="program++">New shader</button>
            </div>
          </div>
          <ExportScene v-else-if="SCENES[at].id === 'export'" />
          <div v-else-if="SCENES[at].id === 'button'" class="scene">
            <DitherButton :color="btn.color" :variant="btn.variant" class="min-h-14 px-9 text-sm">Deploy</DitherButton>
            <div class="seg" role="group" aria-label="Fill">
              <button
                v-for="v in VARIANTS"
                :key="v"
                type="button"
                :aria-pressed="btn.variant === v"
                @click="btn.variant = v"
              >
                {{ v }}
              </button>
            </div>
            <div class="swatches" role="group" aria-label="Colour">
              <button
                v-for="c in COLORS"
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
          <div v-else-if="SCENES[at].id === 'slide'" class="scene">
            <DitherSlideAction label="Slide to deploy" color="blue" class="w-80" @confirm="deploys++" />
            <p class="count">deploys: {{ deploys }}</p>
          </div>
          <div v-else class="scene scene-fill">
            <DitherFerrofluid :colors="[...FLUIDS[fluid]]" class="fluid" />
            <div class="seg fluid-pick" role="group" aria-label="Palette">
              <button v-for="p in FLUID_NAMES" :key="p" type="button" :aria-pressed="fluid === p" @click="fluid = p">
                {{ p }}
              </button>
            </div>
          </div>
        </DitherReveal>
      </div>
    </div>
    <div class="tour" :data-running="playing ? 'true' : undefined">
      <div class="seg tour-pick" role="group" aria-label="Pick a component">
        <button v-for="(s, i) in SCENES" :key="s.id" type="button" :aria-pressed="at === i" @click="pick(i)">
          {{ s.short }}
        </button>
      </div>
      <span :key="at" class="tour-clock" aria-hidden="true" @animationend="show(at + 1)"></span>
    </div>
    <figcaption class="stage-cap">
      <span class="cap-t">{{ SCENES[at].line }}</span>
      <a :href="routePath(SCENES[at].docs)" class="lead">{{ SCENES[at].link }}</a>
    </figcaption>
  </figure>
</template>

<style scoped>
.hero-stage {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 36px 0;
}

/* The seat: the stage floating on its poster. The poster rises past the
   stage's top and runs out to the frame's hairline on the right; it stops
   short of the stage's foot, so it never sits under the picker or the
   caption. A flat print, square-cornered. Gone under 900px. */
.seat {
  position: relative;
  isolation: isolate;
}

.seat-art {
  position: absolute;
  top: -24%;
  bottom: 9%;
  left: 12%;
  right: calc(8px - 1.5rem);
  z-index: -1;
  pointer-events: none;
}

@media (max-width: 899px) {
  .seat-art {
    display: none;
  }
}

/* The stage: 8:5 on the raised ground, a size container so a scene
   answers to it, lifted off the chrome by its shadow. Inside a scene the
   keys and picked segments take the page's ground. */
.stage {
  --stage: var(--surface);
  position: relative;
  overflow: hidden;
  aspect-ratio: 8 / 5;
  container-type: size;
  border-radius: 20px;
  background: var(--stage);
  box-shadow: 0 26px 44px -24px rgb(16 18 20 / 0.6);
}

.scene-wrap {
  --surface: var(--background);
}

.stage-chip {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 4;
}

.scene-wrap,
.scene {
  position: absolute;
  inset: 0;
}

.scene {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 44px 20px 20px;
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
    0 0 0 2px var(--stage),
    0 0 0 3px var(--ink);
}

.count {
  margin: 0;
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--ink-3);
}

/* The chart takes the stage above its roll. */
.scene-chart {
  align-items: stretch;
  gap: 12px;
}

.chart {
  flex: 1;
  min-height: 0;
}

.row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

/* The fluid fills the stage; its palette sits on a strip of the stage's
   ground along the foot. */
.scene-fill {
  padding: 0;
}

.fluid {
  position: absolute;
  inset: 0;
}

.fluid-pick {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: 7px;
  background: var(--stage);
}

.new-program {
  height: 26px;
  padding: 0 9px;
  border-radius: 7px;
  font-size: 11px;
  color: var(--ink);
  background: var(--surface);
}

.new-program:hover {
  color: var(--signal);
}

/* The picker, and the tour's clock: an unseen element whose animation
   runs one scene's turn; its end moves the tour on. */
.tour {
  display: flex;
  flex-direction: column;
}

.tour-pick {
  flex-wrap: wrap;
}

/* On a phone the six keys keep one row. */
@media (max-width: 479px) {
  .tour-pick {
    flex-wrap: nowrap;
    justify-content: space-between;
  }
  .tour-pick > button {
    padding-inline: 7px;
  }
}

.tour-clock {
  height: 0;
}

.tour[data-running] .tour-clock {
  animation: tour-turn 6s linear forwards;
}

.hero-stage:hover .tour-clock,
.hero-stage:focus-within .tour-clock {
  animation-play-state: paused;
}

@keyframes tour-turn {
  to {
    height: 0;
  }
}

/* The caption: the line, and the link on its first line. */
.stage-cap {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 6px 10px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--ink-3);
}

.cap-t {
  flex: 1;
  min-width: 14rem;
  text-wrap: pretty;
}

@media (max-width: 899px) {
  .hero-stage {
    padding: 8px 1.5rem 28px;
  }
}

@media (max-width: 639px) {
  .hero-stage {
    padding-inline: 16px;
  }
}
</style>
