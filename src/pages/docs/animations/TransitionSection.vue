<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue"
import { DitherIcon, ditherTransition, type WipeDirection } from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

/* Three scenes on one stage. Every change between them is a dithered view
   transition of the stage alone; the transport steps, plays and picks at
   random, and the direction and the ink are the transition's own options. */
const SCENES = [
  { title: "Cell by cell", line: "The old state breaks up in the Bayer order.", ground: "bg-card text-foreground" },
  {
    title: "Through the ink",
    line: "A band of colour rides the front between the two.",
    ground: "bg-foreground text-background",
  },
  {
    title: "Any change",
    line: "A route, a theme, a tab: one call wraps it.",
    ground: "bg-accent text-accent-foreground",
  },
] as const
const DIRECTIONS: [WipeDirection, string][] = [
  ["right", "Wipe"],
  ["down", "Drop"],
  ["iris", "Iris"],
  ["none", "Dissolve"],
]
const INK = "var(--swatch-orange)"
const PLAY_MS = 1800

const scene = ref(0)
const direction = ref<WipeDirection>("right")
const ink = ref(true)
const playing = ref(false)
const stage = ref<HTMLElement | null>(null)
let busy = false
let timer = 0

async function go(next: number) {
  if (!stage.value || busy) return
  busy = true
  try {
    await ditherTransition(
      async () => {
        scene.value = (next + SCENES.length) % SCENES.length
        await nextTick()
      },
      { target: stage.value, direction: direction.value, ink: ink.value ? INK : undefined, duration: 700 },
    )
  } finally {
    busy = false
  }
}
const step = (by: number) => go(scene.value + by)
const random = () => go(scene.value + 1 + Math.floor(Math.random() * (SCENES.length - 1)))

function stop() {
  playing.value = false
  clearInterval(timer)
}
function togglePlay() {
  if (playing.value) return stop()
  playing.value = true
  timer = window.setInterval(() => step(1), PLAY_MS)
}

// Playing stops when the stage leaves the screen.
let io: IntersectionObserver | null = null
onMounted(() => {
  if (typeof IntersectionObserver === "undefined" || !stage.value) return
  io = new IntersectionObserver(([entry]) => entry?.isIntersecting || stop())
  io.observe(stage.value)
})
onBeforeUnmount(() => {
  stop()
  io?.disconnect()
})

const KEY = "grid size-7 place-items-center rounded border border-border/60 text-muted-foreground hover:bg-accent/40"
const CHIP = "rounded border px-2 py-1 text-[11px]"
const PICKED = "border-accent bg-accent/80 text-accent-foreground"
const UNPICKED = "border-border/60 text-muted-foreground hover:bg-accent/40"

const SNIPPET = `import { ditherTransition, ditherViewTransition } from "@dither-kit"

// Any DOM change: a scene, a tab, a theme.
await ditherTransition(
  async () => {
    scene.value = next
    await nextTick()
  },
  { target: stage.value, direction: "iris", ink: "var(--swatch-orange)", duration: 700 },
)

// Between pages: opt both in with CSS, @view-transition { navigation: auto; }
// then hand the new page's transition over in a script in its head.
addEventListener("pagereveal", (e) => {
  if (e.viewTransition) ditherViewTransition(e.viewTransition, { direction: "right" })
})`

const API: PropRow[] = [
  { prop: "update", type: "() => void | Promise<void> (the change)", default: "" },
  { prop: "direction", type: "'none' | 'right' | 'left' | 'down' | 'up' | 'iris'", default: "'none' (dissolve)" },
  { prop: "origin", type: "{ x, y } (viewport px; the iris's centre)", default: "the box's centre" },
  { prop: "cell", type: "number (px)", default: "6" },
  { prop: "band", type: "number (cells)", default: "10" },
  { prop: "seed", type: "number (a seeded 4×4 matrix)", default: "none (Bayer 8×8)" },
  { prop: "ink", type: "string (a CSS colour between the two)", default: "none" },
  { prop: "duration", type: "number (ms)", default: "600" },
  { prop: "easing", type: "EasingInput", default: "'ease-in-out'" },
  { prop: "target", type: "HTMLElement (the element that changes)", default: "the whole page" },
]
</script>

<template>
  <section id="dither-transition" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Page transition</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      One state turns into the next through the same masks.
      <code class="text-foreground/80">ditherTransition</code> runs any DOM change as a view transition and dithers its
      two snapshots, the old one breaking up as the new one resolves, with an
      <code class="text-foreground/80">ink</code> riding the front between them. Give it a
      <code class="text-foreground/80">target</code> to change one element while the page stays live, or none for the
      whole page: this site moves between its pages and turns its theme that way. Without the View Transitions API,
      under reduced motion or while the clock is directed, the change just happens.
    </p>
    <DemoCard :code="SNIPPET">
      <div class="flex w-full flex-col items-center gap-3">
        <div
          ref="stage"
          class="grid h-40 w-full max-w-sm place-items-center rounded-lg px-6 text-center"
          :class="SCENES[scene].ground"
          aria-live="polite"
        >
          <div>
            <p class="text-xl tracking-tight">{{ SCENES[scene].title }}</p>
            <p class="mt-1 text-[12px]">{{ SCENES[scene].line }}</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <button type="button" :class="KEY" aria-label="Previous scene" @click="step(-1)">
            <DitherIcon name="ArrowLeft" :size="14" :stroke-width="1.5" />
          </button>
          <button
            type="button"
            :class="KEY"
            :aria-label="playing ? 'Pause' : 'Play'"
            :aria-pressed="playing"
            @click="togglePlay"
          >
            <DitherIcon :name="playing ? 'Pause' : 'Play'" :size="14" :stroke-width="1.5" />
          </button>
          <button type="button" :class="KEY" aria-label="Next scene" @click="step(1)">
            <DitherIcon name="ArrowRight" :size="14" :stroke-width="1.5" />
          </button>
          <button type="button" :class="KEY" aria-label="Random scene" @click="random">
            <DitherIcon name="Dice" :size="14" :stroke-width="1.5" />
          </button>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <button
            v-for="[value, label] in DIRECTIONS"
            :key="value"
            type="button"
            :class="[CHIP, direction === value ? PICKED : UNPICKED]"
            :aria-pressed="direction === value"
            @click="direction = value"
          >
            {{ label }}
          </button>
          <button type="button" :class="[CHIP, ink ? PICKED : UNPICKED]" :aria-pressed="ink" @click="ink = !ink">
            Ink
          </button>
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API" />
  </section>
</template>
