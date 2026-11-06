<script setup lang="ts">
// "Every component, live.": the title beside a line and the docs link, then
// a bento of live kit components, row by row (`BENTO`), each a card of its
// art over its name. The name leads into the docs section; the art is the
// component itself, hands on, in the kit's blue with the ember for a second
// voice. Each card's art prints itself once as it comes into view; of the
// surfaces that move by themselves one plays at a time; everything that
// moves has its pause.
import {
  computed,
  defineAsyncComponent,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
  type WritableComputedRef,
} from "vue"
import {
  Area,
  AreaChart,
  DitherButton,
  DitherDecryptedText,
  DitherGauge,
  DitherGradient,
  DitherIcon,
  DitherKnob,
  DitherNumberFlow,
  DitherReveal,
  DitherScreen,
  DitherSilk,
  DitherSlideAction,
  DitherWorld,
  SCREEN_KINDS,
  Sparkline,
  XAxis,
  cssColor,
  sampleWorld,
  type ButtonVariant,
  type DitherColor,
  type ScreenKind,
} from "@dither-kit"
import { routePath } from "@/shared/lib"
import { COMPONENT_COUNT } from "./facts"
import { BENTO, staggers } from "./hub"
import { DAYS, FRAMES, WEEK_CHANGE, ago, shown } from "./stat"
import PauseChip from "./PauseChip.vue"
import { spotlight } from "./spotlight"

// The heavy cards are their own chunks, fetched as the card nears the
// viewport: the shader's WebGL engine, the translator's utility map, the
// fluid's canvas engine.
const DitherShader = defineAsyncComponent(() => import("@dither-kit/tailwind/DitherShader.vue"))
const ExportScene = defineAsyncComponent(() => import("./ExportScene.vue"))
const DitherFerrofluid = defineAsyncComponent(() => import("@dither-kit/tailwind/Ferrofluid.vue"))
const LAZY = new Set(["shader", "styling", "ferrofluid"])
const near = reactive(new Set<string>())
// Cards whose art runs to the card's edges.
const FLUSH = new Set(["world", "print-screens", "silk", "shader", "ferrofluid", "styling"])
const bento = ref<HTMLElement | null>(null)

// One moving layer at a time (`spotlight.ts`): of the surfaces that move by
// themselves only the spotlit one plays, the rest hold a still frame. A
// chip says whether its surface plays: a pause is the reader's and outlasts
// the spotlight, and play on a held surface makes it the reader's choice.
// A mouse or pen hovering a card, or keyboard focus inside it, points at
// it; a touch chooses through the chip, since a tap (which also focuses)
// would point at the card and then toggle what it just started.
const MOVING = ["world", "shader", "ferrofluid", "silk"] as const
type Moving = (typeof MOVING)[number]
const isMoving = (id: string): id is Moving => (MOVING as readonly string[]).includes(id)
const stilled = reactive(new Set<Moving>())
const pointed = ref<Moving | null>(null)
const chosen = ref<Moving | null>(null)
const visible = reactive(new Set<Moving>())
const centred = reactive(new Set<Moving>())
const last = ref<Moving | null>(null)
const lit = computed(() =>
  spotlight(MOVING, { pointed: pointed.value, chosen: chosen.value, visible, centred, last: last.value }),
)
watch(lit, (id) => (last.value = id))
const playing = reactive(
  Object.fromEntries(
    MOVING.map((id) => [
      id,
      computed({
        get: () => lit.value === id && !stilled.has(id),
        set: (on: boolean) => {
          if (!on) return stilled.add(id)
          stilled.delete(id)
          chosen.value = id
        },
      }),
    ]),
  ) as Record<Moving, WritableComputedRef<boolean>>,
)
const aim = (id: string) => {
  if (!isMoving(id)) return
  pointed.value = id
  chosen.value = id
}
const hover = (e: PointerEvent, id: string) => {
  if (e.pointerType !== "touch") aim(id)
}
const focus = (e: FocusEvent, id: string) => {
  if (e.target instanceof Element && e.target.matches(":focus-visible")) aim(id)
}
const leave = (id: string) => {
  if (pointed.value === id) pointed.value = null
}

const observers: IntersectionObserver[] = []
const watchCards = (
  selector: string,
  init: IntersectionObserverInit,
  on: (el: HTMLElement, inside: boolean, io: IntersectionObserver) => void,
) => {
  const cards = [...(bento.value?.querySelectorAll<HTMLElement>(selector) ?? [])]
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) on(e.target as HTMLElement, e.isIntersecting, io)
  }, init)
  for (const c of cards) io.observe(c)
  observers.push(io)
}
const movingOf = (el: HTMLElement) => el.dataset.moving as Moving
// Each card's reveal delay, read from the laid-out bento before any reveal
// plays (a reveal starts as its card comes into view, after this).
const delays = ref<number[]>([])
onMounted(() => {
  const box = bento.value?.getBoundingClientRect()
  const cards = [...(bento.value?.children ?? [])].map((c) => c.getBoundingClientRect())
  if (box)
    delays.value = staggers(
      cards.map((c) => ({ top: c.top - box.top, left: c.left - box.left })),
      box.width,
    )
  if (typeof IntersectionObserver === "undefined") {
    bento.value?.querySelectorAll<HTMLElement>("[data-lazy]").forEach((c) => near.add(c.dataset.lazy ?? ""))
    for (const id of MOVING) {
      visible.add(id)
      centred.add(id)
    }
    return
  }
  // The heavy cards load 600px ahead; each moving card is tracked on screen
  // and across the middle tenth of the viewport.
  watchCards("[data-lazy]", { rootMargin: "600px 0px" }, (el, inside, io) => {
    if (!inside) return
    near.add(el.dataset.lazy ?? "")
    io.unobserve(el)
  })
  watchCards("[data-moving]", {}, (el, inside) => (inside ? visible.add(movingOf(el)) : visible.delete(movingOf(el))))
  watchCards("[data-moving]", { rootMargin: "-45% 0px -45% 0px" }, (el, inside) =>
    inside ? centred.add(movingOf(el)) : centred.delete(movingOf(el)),
  )
})
onBeforeUnmount(() => observers.forEach((io) => io.disconnect()))

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

// Rating.
// The instrument: the knob sets the load, the dial's needle settles on it.
const load = ref(64)

// Print screens: one tone ramp, raw on the left and printed on the right,
// the split dragged (or stepped by keyboard) and the screen switched in
// place. The raw ramp runs in linear light, so the printed cells average to
// it: from a step back the two halves are one tone.
const screen = ref<ScreenKind>("bayer")
const split = ref(42)

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
// Four digits, as the first: every roll keeps its columns and rolls them.
const roll = () => (fills.value = 1000 + Math.floor(Math.random() * 9000))

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

// Ferrofluid: the ember first (beside the blue area chart), the kit's blue,
// or the page's grey.
const FLUIDS = {
  blue: ["#2f6fd0", "#7ba3ee", "#c9dbff"],
  ember: ["#a84d17", "#f08a3c", "#ffd9b0"],
  grey: ["#25292d", "#5d6268", "#a6abb1"],
} as const
type Fluid = keyof typeof FLUIDS
const FLUID_NAMES = Object.keys(FLUIDS) as Fluid[]
const fluid = ref<Fluid>("ember")

// Slide action: how many slides confirmed.
const confirmed = ref(0)

// Stat card: scrub the chart and the headline rolls to the day under the
// pointer (`stat.ts`).
const day = ref<number | null>(null)

// Silk, in the kit's blue.
const SILK = [BLUE[2], BLUE[4], BLUE[2]]
</script>

<template>
  <section id="examples" aria-labelledby="examples-h" class="examples">
    <div class="sec-head">
      <h2 id="examples-h" class="section-title chrome-type">Every component, live.</h2>
      <div class="sec-side">
        <p class="sec-lede">
          {{ COMPONENT_COUNT }} components on one engine. Every card is the real thing, so poke it, then open its docs
          for the props and the code.
        </p>
        <a :href="routePath('/docs')" class="more-link">See every section in the docs</a>
      </div>
    </div>

    <ul ref="bento" class="bento" aria-label="Examples from the docs">
      <li
        v-for="(t, i) in BENTO"
        :key="t.id"
        class="card"
        :class="`t-${t.id}`"
        :data-lazy="LAZY.has(t.id) ? t.id : undefined"
        :data-moving="isMoving(t.id) ? t.id : undefined"
        @pointerenter="hover($event, t.id)"
        @pointerleave="leave(t.id)"
        @focusin="focus($event, t.id)"
        @focusout="leave(t.id)"
      >
        <DitherReveal
          :class="FLUSH.has(t.id) ? 'card-art flush' : 'card-art'"
          :duration="0.72"
          :delay="delays[i] ?? 0"
          easing="spring"
        >
          <template v-if="t.id === 'world'">
            <DitherWorld
              :source="world"
              :colors="RAMPS[ramp]"
              :auto-rotate="playing.world ? 14 : 0"
              :grain="0.4"
              :frame-rate="12"
              :label="`A seeded 3D probe, model ${model}, turning slowly through the kit's Bayer cells`"
              class="h-full w-full"
            />
            <PauseChip v-model="playing.world" label="Pause the model" class="chip" />
            <div class="art-tools">
              <div class="seg" role="group" aria-label="Model ramp">
                <button v-for="r in RAMP_NAMES" :key="r" type="button" :aria-pressed="ramp === r" @click="ramp = r">
                  {{ r }}
                </button>
              </div>
              <button type="button" class="key" @click="model++">New model</button>
            </div>
          </template>

          <div v-else-if="t.id === 'gauge'" class="instrument">
            <DitherGauge :value="load" label="load" :warn="0.8" class="instrument-dial" />
            <DitherKnob v-model="load" :size="52" label="Load" />
          </div>

          <div v-else-if="t.id === 'print-screens'" class="split" :style="{ '--split': `${split}%` }">
            <DitherScreen :screen="screen">
              <DitherGradient from="#e4e1d8" to="#101214" direction="down" :cell="5" class="split-layer" />
            </DitherScreen>
            <div class="split-layer split-raw" aria-hidden="true"></div>
            <input
              v-model.number="split"
              type="range"
              min="0"
              max="100"
              class="split-range"
              aria-label="The ramp raw on the left, printed on the right: move the split"
            />
            <span class="split-handle" aria-hidden="true"
              ><span class="split-grip"><DitherIcon name="GripVertical" :size="14" :stroke-width="1.75" /></span
            ></span>
            <div class="art-tools">
              <div class="seg" role="group" aria-label="Screen">
                <button
                  v-for="k in SCREEN_KINDS"
                  :key="k"
                  type="button"
                  :aria-pressed="screen === k"
                  @click="screen = k"
                >
                  {{ k }}
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="t.id === 'area'" class="panel">
            <AreaChart
              :key="fills"
              :data="AREA_ROWS"
              :config="AREA_CONFIG"
              :seed="fills"
              :sparkles="false"
              class="area-chart"
            >
              <XAxis data-key="month" :max-ticks="6" />
              <Area data-key="expenses" :variant="fills + 1" />
              <Area data-key="revenue" :variant="fills" />
            </AreaChart>
            <div class="row">
              <button type="button" class="key" @click="roll">Roll a seed</button>
              <span class="readout">seed <DitherNumberFlow :value="fills" :duration="320" /></span>
            </div>
          </div>

          <div v-else-if="t.id === 'button'" class="stack">
            <DitherButton :color="btn.color" :variant="btn.variant" class="min-h-12 px-8 text-sm">Publish</DitherButton>
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
                :paused="!playing.shader"
                :label="`The kit's sample shader, seed ${program}`"
                class="h-full w-full"
              />
            </div>
            <PauseChip v-model="playing.shader" label="Pause the shader" class="chip" />
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
                :paused="!playing.ferrofluid"
                class="h-full w-full"
              />
            </div>
            <PauseChip v-model="playing.ferrofluid" label="Pause the fluid" class="chip" />
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
            <DitherSlideAction label="Slide to confirm" color="blue" class="w-full max-w-80" @confirm="confirmed++" />
            <span class="readout">confirmed <DitherNumberFlow :value="confirmed" :duration="320" /></span>
          </div>

          <div v-else-if="t.id === 'stats-cards'" class="panel stat">
            <span class="panel-d">Frames exported</span>
            <DitherNumberFlow :value="shown(day)" :duration="240" class="stat-v" />
            <span class="panel-d stat-sub">
              <span :data-on="day === null ? '' : undefined" :aria-hidden="day !== null"
                ><b>+{{ WEEK_CHANGE }}%</b> on the week before</span
              >
              <span :data-on="day === null ? undefined : ''" :aria-hidden="day === null">{{
                ago(day ?? DAYS - 1)
              }}</span>
            </span>
            <Sparkline
              :data="FRAMES"
              color="blue"
              interactive
              label="Frames exported"
              :hover-lift="false"
              :sparkles="false"
              class="stat-spark"
              @hover-change="(i) => (day = i)"
            />
          </div>

          <template v-else-if="t.id === 'silk'">
            <DitherSilk :colors="SILK" :frame-rate="12" :paused="!playing.silk" class="h-full w-full" />
            <PauseChip v-model="playing.silk" label="Pause the silk" class="chip" />
          </template>

          <p v-else-if="t.id === 'decrypted-text'" class="cipher">
            <DitherDecryptedText text="Decoded as" />
            <DitherDecryptedText text="it comes into view." />
          </p>
        </DitherReveal>
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
   stacked (4); a full row; a wide card (8) beside a third; two halves; a
   wide card beside a third; two halves. The order (`BENTO`) keeps unlike
   cards side by side and stacked. Under 1024px a rail (below), so the
   whole bento takes one screen. */
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

.t-print-screens {
  grid-column: 1 / -1;
}

.t-area,
.t-styling {
  grid-column: span 8;
}

.t-silk,
.t-decrypted-text,
.t-shader,
.t-button {
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

.t-gauge .card-art,
.t-stats-cards .card-art {
  height: 220px;
  padding: 18px 20px;
}

.t-print-screens .card-art,
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

/* The footer: the name, the docs link, at page type (a card's copy is the
   page's, never the size of the UI inside it). */
.card-foot {
  display: flex;
  align-items: center;
  min-height: 56px;
  margin: 0;
  padding: 0 22px 6px;
}

.card-name {
  margin-block: -4px;
  padding-block: 4px;
  font-size: 17px;
  color: var(--ink);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
  text-decoration-color: transparent;
  transition: text-decoration-color 200ms var(--ease-settle);
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

/* The five screens keep inside the card on the narrowest phones. */
@media (max-width: 359px) {
  .art-tools .seg > button {
    padding-inline: 8px;
  }
}

.chip {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
}

/* Print screens: the printed ramp under the raw one, the raw clipped at the
   split; a full-size range takes the drag (vertical swipes still scroll) and
   the keys, its handle a bone disc on a bone line. */
.split-layer {
  position: absolute;
  inset: 0;
}

.split-raw {
  background: linear-gradient(in srgb-linear to bottom, #e4e1d8, #101214);
  clip-path: inset(0 calc(100% - var(--split)) 0 0);
}

.split-range {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: ew-resize;
  touch-action: pan-y;
}

.split-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--split);
  z-index: 1;
  width: 1px;
  background: var(--ink);
  pointer-events: none;
}

.split-grip {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  color: var(--background);
  background: var(--ink);
  translate: -50% -50%;
}

/* The ring sits on a band of the ground, so it shows on the light end of
   the ramp as on the dark. */
.split-range:focus-visible + .split-handle .split-grip {
  outline: 2px solid var(--ring);
  outline-offset: 3px;
  box-shadow: 0 0 0 3px var(--background);
}

.stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 100%;
  height: 100%;
}

.instrument {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  width: 100%;
  height: 100%;
}
.instrument-dial {
  width: min(55%, 180px);
}
.t-gauge .stack,
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

/* A small app panel: a label line, a big figure, then its chart. */
.panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  height: 100%;
}

.panel-d {
  font-size: 11.5px;
  color: var(--ink-3);
}

.panel-d b {
  font-weight: 500;
  color: var(--ink);
}

/* The stat card: its figures over a chart that takes the rest of the art,
   scrubbed by the pointer. The line under the figure holds both its
   readings in one cell and crossfades between them. */
.stat-sub {
  display: grid;
}

.stat-sub > span {
  grid-area: 1 / 1;
  opacity: 0;
  transition: opacity 200ms var(--ease-settle);
}

.stat-sub > span[data-on] {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .stat-sub > span {
    transition: none;
  }
}

.stat-v {
  font-size: 1.9rem;
  font-weight: 500;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

.stat-spark {
  flex: 1;
  min-height: 72px;
  margin-top: 10px;
  cursor: crosshair;
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

/* Under 1024px a rail the reader swipes: a card and the next one's edge
   in view (a phone's card most of its width), the rail running out to the
   page's edges past its gutter (24px, 16px on a phone). */
@media (max-width: 1023px) {
  .bento {
    --gutter: 24px;
    display: flex;
    gap: 12px;
    margin-inline: calc(var(--gutter) * -1);
    padding: 0 var(--gutter) 4px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: var(--gutter);
    scrollbar-width: none;
  }
  .bento::-webkit-scrollbar {
    display: none;
  }
  .card {
    flex: 0 0 min(86%, 440px);
    scroll-snap-align: start;
  }
  /* Every card the rail's height: the art takes what the name leaves. */
  .bento .card .card-art {
    flex: 1;
    height: auto;
    min-height: 340px;
  }
}

@media (max-width: 639px) {
  .bento {
    --gutter: 16px;
  }
}
</style>
