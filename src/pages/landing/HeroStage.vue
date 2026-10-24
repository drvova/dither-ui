<script setup lang="ts">
// The hero's stage: the kit by hand, one real component at a time, the way
// the film shows it (each framed alone in a docs-style well, its name in the
// corner, the controls its docs demo has). The picker under the well
// chooses a scene and the tour moves on by itself: a CSS animation on the
// progress rule whose end advances it (no timer), paused while the stage is
// hovered or holds focus. The chip pauses it; using a scene or picking one
// stops it there; under reduced motion it starts paused. A new scene
// dissolves in through the kit's own ordered dither (`DitherReveal`); the
// first one is simply there, and it is the only one in the static page.
import { defineAsyncComponent, onMounted, reactive, ref } from "vue"
import {
  DitherButton,
  DitherHoldAction,
  DitherIcon,
  DitherReveal,
  DitherSlideAction,
  DitherTextPressure,
  cssColor,
  type ButtonVariant,
  type DitherColor,
  type IconName,
} from "@dither-kit"
import { routePath } from "@/shared/lib"
import PauseChip from "./PauseChip.vue"

// The fluid's canvas engine is the heaviest scene: its own chunk, fetched
// when the scene is first picked.
const DitherFerrofluid = defineAsyncComponent(() => import("@dither-kit/Ferrofluid.vue"))

type Scene = { id: string; short: string; name: string; icon: IconName; line: string; docs: string; link: string }
const SCENES: Scene[] = [
  {
    id: "button",
    short: "Button",
    name: "DitherButton",
    icon: "Palette",
    line: "Four fills and five hues from one engine. Pick one.",
    docs: "/docs/button",
    link: "Button docs",
  },
  {
    id: "slide",
    short: "Slide",
    name: "DitherSlideAction",
    icon: "ArrowRight",
    line: "Drag the thumb to the end, or focus it and press Enter.",
    docs: "/docs/slide-action",
    link: "Slide action docs",
  },
  {
    id: "hold",
    short: "Hold",
    name: "DitherHoldAction",
    icon: "Clock",
    line: "Hold to finish. Let go early and the fill drains back.",
    docs: "/docs/hold-action",
    link: "Hold action docs",
  },
  {
    id: "pressure",
    short: "Pressure",
    name: "DitherTextPressure",
    icon: "Type",
    line: "Each letter swells as the cursor comes near.",
    docs: "/docs/text-pressure",
    link: "Text pressure docs",
  },
  {
    id: "ferrofluid",
    short: "Ferrofluid",
    name: "DitherFerrofluid",
    icon: "Pulse",
    line: "A fluid surface that parts around the cursor.",
    docs: "/docs/ferrofluid",
    link: "Ferrofluid docs",
  },
]

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
const VARIANTS: ButtonVariant[] = ["gradient", "dotted", "hatched", "solid"]
const COLORS: DitherColor[] = ["blue", "green", "purple", "pink", "orange"]
const btn = reactive({ variant: "gradient" as ButtonVariant, color: "blue" as DitherColor })
const deploys = ref(0)
const holds = ref(0)
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
    <div class="thumb stage" @pointerdown="hold" @keydown="hold">
      <span class="stage-name">{{ SCENES[at].name }}</span>
      <PauseChip
        v-model="playing"
        label="Pause the component tour"
        class="stage-chip"
        @pointerdown.stop
        @keydown.stop
      />
      <DitherReveal :key="at" :progress="moved ? undefined : 1" :duration="0.6" :cell="6" class="scene-wrap">
        <div v-if="SCENES[at].id === 'button'" class="scene">
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
          <DitherSlideAction label="Slide to deploy" color="green" class="w-80" @confirm="deploys++" />
          <p class="count">deploys: {{ deploys }}</p>
        </div>
        <div v-else-if="SCENES[at].id === 'hold'" class="scene">
          <div class="holds">
            <DitherHoldAction color="orange" class="px-6 py-4 text-[13px]" @complete="holds++"
              >Hold to purge cache</DitherHoldAction
            >
            <DitherHoldAction
              direction="horizontal"
              color="blue"
              :duration="900"
              class="px-6 py-4 text-[13px]"
              @complete="holds++"
              >Hold to archive</DitherHoldAction
            >
          </div>
          <p class="count">completed: {{ holds }}</p>
        </div>
        <div v-else-if="SCENES[at].id === 'pressure'" class="scene">
          <DitherTextPressure text="dither-ui" class="pressure" />
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
    <div class="tour" :data-running="playing ? 'true' : undefined">
      <div class="seg tour-pick" role="group" aria-label="Pick a component">
        <button v-for="(s, i) in SCENES" :key="s.id" type="button" :aria-pressed="at === i" @click="pick(i)">
          {{ s.short }}
        </button>
      </div>
      <span class="tour-rule" aria-hidden="true"
        ><span :key="at" class="tour-fill" @animationend="show(at + 1)"
      /></span>
    </div>
    <figcaption class="stage-cap">
      <DitherIcon :name="SCENES[at].icon" :size="14" :stroke-width="1.5" class="cap-i" />
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

/* The well: 8:5, a size container so a scene answers to it. */
.stage {
  aspect-ratio: 8 / 5;
  container-type: size;
}

/* The component's name, on the well's own ground so it reads over a scene
   that fills the well. */
.stage-name {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11.5px;
  color: var(--ink-3);
  background: var(--well);
  pointer-events: none;
}

.stage-chip {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
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
    0 0 0 2px var(--well),
    0 0 0 3px var(--ink);
}

.holds {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
}

.count {
  margin: 0;
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--ink-3);
}

.pressure {
  font-size: min(14cqw, 6.5rem);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--ink);
}

/* The fluid fills the well; its palette sits on a strip of the well's
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
  padding: 3px;
  border-radius: 7px;
  background: var(--well);
}

/* The picker, and under it the tour's progress: a hairline that fills over
   one scene's turn; its end moves the tour on. */
.tour {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tour-pick {
  flex-wrap: wrap;
}

.tour-rule {
  position: relative;
  height: 1px;
  overflow: hidden;
  background: var(--line);
}

.tour-fill {
  position: absolute;
  inset: 0;
  transform-origin: left;
  transform: scaleX(0);
  background: var(--ink-3);
}

.tour[data-running] .tour-fill {
  animation: tour-turn 6s linear forwards;
}

.hero-stage:hover .tour-fill,
.hero-stage:focus-within .tour-fill {
  animation-play-state: paused;
}

@keyframes tour-turn {
  to {
    transform: scaleX(1);
  }
}

.stage-cap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
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

@media (max-width: 899px) {
  .hero-stage {
    padding: 8px 1.5rem 28px;
  }
}
</style>
