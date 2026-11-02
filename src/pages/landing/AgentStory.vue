<script setup lang="ts">
// The ask as a story: a stage pinned while the page scrolls past it plays
// one agent session (`story.ts`), a step per notch. Composed as a product
// shot, corner bleed: the session sits at the left like copy beside a hero
// (the ask as the sent message, then what the agent does, the line at work
// under a spinner, the done ones checked), and the Deploys screen it lays
// out is the hero at the right, inset a gutter from the stage's top and left
// and running off its right and bottom edges, where only the chart (filler
// that reads when cut) goes. The screen is never blank: each part's slot
// holds its place, and the parts resolve in their slots top to bottom as
// the agent lays them out. The step is the marker crossing the viewport's
// middle (one IntersectionObserver, no scroll listener). Under 900px, or
// without an observer, the stage is not pinned and shows the last step, the
// whole session and screen. Screen readers get the whole session as a
// caption; the stage that plays it is decoration.
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue"
import {
  DitherIcon,
  DitherNumberText,
  DitherProgress,
  DitherSpinner,
  DitherSwitch,
  DitherText,
  Sparkline,
} from "@dither-kit"
import { ASK, DAYS, DEPLOYS, DOES, lineState, PARTS, RENDER, STEPS } from "./story"

const LAST = STEPS - 1
const TOLD = DOES.map((d) => d[0].toLowerCase() + d.slice(1))

const step = ref(LAST)
const pinned = ref(false)
const auto = ref(true)

const markers = ref<HTMLElement[]>([])
let io: IntersectionObserver | null = null
let wide: MediaQueryList | null = null
const inBand = new Set<number>()

async function arm() {
  io?.disconnect()
  io = null
  inBand.clear()
  pinned.value = typeof IntersectionObserver !== "undefined" && (wide?.matches ?? false)
  if (!pinned.value) {
    step.value = LAST
    return
  }
  step.value = 0
  // The markers render with the pin: observe them once they are there.
  await nextTick()
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const i = markers.value.indexOf(e.target as HTMLElement)
        if (i < 0) continue
        if (e.isIntersecting) inBand.add(i)
        else inBand.delete(i)
      }
      if (inBand.size) step.value = Math.max(...inBand)
    },
    { rootMargin: "-50% 0px -50% 0px" },
  )
  for (const m of markers.value) io.observe(m)
}

onMounted(() => {
  wide = window.matchMedia("(min-width: 900px)")
  wide.addEventListener("change", arm)
  arm()
})
onBeforeUnmount(() => {
  wide?.removeEventListener("change", arm)
  io?.disconnect()
})
</script>

<template>
  <div class="story" :class="{ pinned }" :style="{ '--steps': STEPS }">
    <figure id="agent-ask" class="pin">
      <div class="stage">
        <!-- The session as it plays: decoration over the caption. -->
        <div class="session" aria-hidden="true">
          <p class="ask">{{ ASK }}</p>
          <ol class="does">
            <li v-for="(line, i) in DOES" :key="line" :class="lineState(i, step)">
              <span class="mark">
                <DitherSpinner v-if="lineState(i, step) === 'working'" :size="14" color="orange" />
                <DitherIcon v-else name="Check" :size="14" :stroke-width="1.75" />
              </span>
              {{ line }}
            </li>
          </ol>
        </div>

        <!-- The screen the agent lays out, the hero of the shot. -->
        <div class="screen">
          <!-- The render's result, a chip on the screen's corner: it comes
               with the line that renders, at work, then ready. -->
          <div class="render" :class="lineState(RENDER, step)">
            <span class="mark">
              <DitherSpinner v-if="lineState(RENDER, step) !== 'done'" :size="14" color="orange" />
              <DitherIcon v-else name="Check" :size="14" :stroke-width="1.75" />
            </span>
            <span class="render-words">
              <span :data-on="lineState(RENDER, step) !== 'done' ? '' : undefined">Rendering MP4</span>
              <span :data-on="lineState(RENDER, step) === 'done' ? '' : undefined">MP4 ready</span>
            </span>
          </div>
          <div class="screen-title">Deploys</div>
          <div class="screen-row">
            <div class="part" :class="{ on: step >= PARTS.count }">
              <span class="slot" />
              <div class="count">
                <DitherNumberText :value="DEPLOYS" class="count-n" />
                <DitherText tone="muted" size="xs">deploys this week</DitherText>
              </div>
            </div>
            <div class="part" :class="{ on: step >= PARTS.meter }">
              <span class="slot" />
              <div class="meter">
                <DitherText tone="muted" size="xs">Build minutes, 64% used</DitherText>
                <DitherProgress :value="64" color="blue" aria-label="Build minutes" />
              </div>
            </div>
          </div>
          <div class="part part-switch" :class="{ on: step >= PARTS.toggle }">
            <span class="slot" />
            <div class="switch">
              <DitherSwitch v-model="auto" label="Auto deploy" />
              <span aria-hidden="true">Auto deploy</span>
            </div>
          </div>
          <div class="part part-chart" :class="{ on: step >= PARTS.chart }">
            <span class="slot" />
            <Sparkline :data="[...DAYS]" color="blue" variant="dotted" :sparkles="false" class="chart" />
          </div>
        </div>
      </div>

      <figcaption class="sr-only">
        The ask: {{ ASK }} Your agent {{ TOLD.slice(0, -1).join(", ") }} and {{ TOLD[TOLD.length - 1] }}.
      </figcaption>
    </figure>
    <div v-if="pinned" class="markers" aria-hidden="true">
      <span
        v-for="i in STEPS"
        :key="i"
        :ref="
          (el) => {
            if (el) markers[i - 1] = el as HTMLElement
          }
        "
      />
    </div>
  </div>
</template>

<style scoped>
/* The story's run: a notch of scroll per step, then the pinned stage's own
   height, so the last step holds a beat before the stage lets go. */
.story {
  --notch: 32svh;
  /* Most of the screen while it plays: the stage is the frame, never a band
     with the page's ground under it. */
  --pin: min(calc(100svh - 112px), 40rem);
  position: relative;
}

.story.pinned {
  height: calc(var(--steps) * var(--notch) + var(--pin));
}

.pin {
  margin: 0;
}

.pinned .pin {
  position: sticky;
  top: 76px;
  height: var(--pin);
}

.markers {
  position: absolute;
  inset: 0 auto auto 0;
  display: flex;
  flex-direction: column;
  width: 1px;
  height: calc(var(--steps) * var(--notch));
  pointer-events: none;
}

.markers > span {
  flex: 1;
}

/* The stage: one raised ground, the shot's frame. Its gutter is the one
   distance every edge keeps: the session's inset, the screen's top and left. */
.stage {
  --gutter: 32px;
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  /* One row, the stage's height: the screen overflows it (the bleed), never
     stretches it, so the session stays centred on the stage. */
  grid-template-rows: minmax(0, 1fr);
  gap: var(--gutter);
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 24px;
  background: var(--surface);
}

/* The session: the ask as the sent message, then the agent at work. */
.session {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 22px;
  min-height: 0;
  padding: var(--gutter) 0 var(--gutter) var(--gutter);
}

.ask {
  margin: 0;
  padding: 14px 18px;
  border-radius: 16px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--ink);
  background: var(--background);
  text-wrap: pretty;
}

.does {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0 0 0 4px;
  list-style: none;
}

.does li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12.5px;
  color: var(--ink-3);
  transition:
    opacity 240ms var(--ease-settle),
    translate 240ms var(--ease-settle),
    color 240ms var(--ease-settle);
}

/* The line at work reads in the full ink; done lines step back. */
.does li.working {
  color: var(--ink);
}

.does li.ahead {
  visibility: hidden;
  opacity: 0;
  translate: 0 6px;
}

/* One cell for the spinner and the check, so a line never shifts as its
   mark turns. */
.mark {
  display: grid;
  flex: none;
  place-items: center;
  width: 16px;
  height: 16px;
  color: var(--signal);
}

/* The hero: the screen on the page's ground, a gutter from the stage's top
   and from the session, running off the stage's right and bottom edges. */
.screen {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 22px;
  align-self: start;
  width: calc(100% + 15%);
  height: calc(100% - var(--gutter) + 80px);
  margin-top: var(--gutter);
  padding: 28px;
  border-radius: 16px;
  background: var(--background);
}

.screen-title {
  font-size: 14px;
  color: var(--ink);
}

.screen-row {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr);
  gap: 32px;
  max-width: 34rem;
}

/* A part and its slot share one cell: the slot holds the part's place on the
   raised ground until the agent lays the part out, then the part arrives as
   the slot leaves. */
.part {
  display: grid;
  align-items: center;
}

.part > * {
  grid-area: 1 / 1;
  transition:
    opacity 240ms var(--ease-settle),
    translate 240ms var(--ease-settle);
}

.slot {
  align-self: stretch;
  border-radius: 8px;
  background: var(--surface);
}

.part > :not(.slot) {
  opacity: 0;
  translate: 0 6px;
}

.part.on > .slot {
  opacity: 0;
}

.part.on > :not(.slot) {
  opacity: 1;
  translate: 0;
}

.count {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.count-n {
  font-size: 2.75rem;
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

.meter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.part-switch {
  align-self: flex-start;
}

.switch {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--ink);
}

/* The screen's switch is a real control: it keeps its place in the tab
   order whatever the scroll, out of the pointer's reach until it shows, and
   a keyboard that reaches it lands the whole screen at once. */
.part-switch:not(.on) .switch {
  pointer-events: none;
}

.screen:focus-within .part > .slot {
  opacity: 0;
}

.screen:focus-within .part > :not(.slot) {
  opacity: 1;
  translate: 0;
  pointer-events: auto;
}

/* The chart, the filler the crop cuts: quiet (the dotted fill, low, so the
   count stays the heaviest mark), right under the switch (no band of
   nothing above it) and running well past the stage's foot. */
.part-chart {
  flex: 1;
  min-height: 160px;
  margin-top: 4px;
  align-items: stretch;
}

.chart {
  width: 100%;
  height: 100%;
}

/* The render chip, centred on the screen's top-left corner, half over the
   stage: a step above both grounds, so it reads on either. Its words share
   one cell and crossfade. */
.render {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px 8px 10px;
  border-radius: 999px;
  font-size: 12px;
  white-space: nowrap;
  color: var(--ink);
  background: color-mix(in oklab, var(--foreground) 14%, var(--background));
  translate: -50% -50%;
  transition:
    opacity 240ms var(--ease-settle),
    translate 240ms var(--ease-settle);
}

.render.ahead {
  visibility: hidden;
  opacity: 0;
  translate: -50% calc(-50% + 6px);
}

.render-words {
  display: grid;
}

.render-words > span {
  grid-area: 1 / 1;
  opacity: 0;
  transition: opacity 160ms var(--ease-settle);
}

.render-words > span[data-on] {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .part > *,
  .does li,
  .render,
  .render-words > span {
    transition: none;
  }
}

/* Unpinned (under 900px): the session over the screen, which keeps its
   bleed, off the stage's right and foot. */
@media (max-width: 899px) {
  .stage {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto;
    gap: 24px;
    --gutter: 20px;
  }
  .session {
    padding: var(--gutter) var(--gutter) 0;
  }
  .screen {
    width: calc(100% + 12%);
    height: auto;
    min-height: 300px;
    margin: 0 0 -48px var(--gutter);
    padding: 22px;
  }
  .screen-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }
  /* The stage's left edge is a gutter away: the chip rides the screen's top
     edge from the corner in, whole. */
  .render {
    left: 18px;
    translate: 0 -50%;
  }
}
</style>
