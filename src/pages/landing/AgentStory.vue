<script setup lang="ts">
// The ask as a story: a stage pinned while the page scrolls past it plays
// one agent session (`story.ts`), a step per notch. The ask comes first,
// then what the agent does, a line at a time, while the screen it lays out
// builds on the left part by part. The step is the marker crossing the
// viewport's middle (one IntersectionObserver, no scroll listener). Under
// 900px, or without an observer, the stage is not pinned and shows the
// whole session at once. Screen readers get the whole session as a
// caption; the stage that plays it is decoration.
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue"
import { DitherHeading, DitherIcon, DitherNumberText, DitherProgress, DitherSwitch, DitherText } from "@dither-kit"
import { ASK, DOES, PARTS, STEPS } from "./story"

const LAST = STEPS - 1
const TOLD = DOES.map((d) => d.line[0].toLowerCase() + d.line.slice(1))

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
        <div class="canvas">
          <div class="frame" :class="{ on: step >= PARTS.count }">
            <div class="part" :class="{ off: step < PARTS.count }">
              <DitherHeading level="3">Deploys</DitherHeading>
              <div class="frame-row">
                <DitherNumberText :value="16" class="frame-n" />
                <DitherText tone="muted" size="xs">deploys this week</DitherText>
              </div>
            </div>
            <div class="part frame-meter" :class="{ off: step < PARTS.meter }">
              <DitherText tone="muted" size="xs">Build minutes, 64% used</DitherText>
              <DitherProgress :value="64" color="blue" aria-label="Build minutes" />
            </div>
            <div class="part frame-switch" :class="{ off: step < PARTS.toggle }">
              <DitherSwitch v-model="auto" label="Auto deploy" />
              <span aria-hidden="true">Auto deploy</span>
            </div>
          </div>
          <p class="wait" :class="{ off: step >= PARTS.count }" aria-hidden="true">The screen lands here.</p>
        </div>

        <!-- The session as it plays: decoration over the caption. -->
        <div class="session" aria-hidden="true">
          <p class="ask">{{ ASK }}</p>
          <ol class="does">
            <li v-for="d in DOES" :key="d.line" :class="{ off: step < d.step }">
              <DitherIcon name="Check" :size="13" :stroke-width="1.75" />{{ d.line }}
            </li>
          </ol>
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
  --notch: 40svh;
  --pin: min(calc(100svh - 96px), 30rem);
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

/* The stage: one raised ground, the screen's canvas beside the session. */
.stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 24rem);
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 24px;
  background: var(--surface);
}

.canvas {
  position: relative;
  display: grid;
  place-items: center;
  padding: 32px 24px;
}

/* The screen the agent lays out: the page's ground on the stage. */
.frame {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  width: min(100%, 28rem);
  min-height: 15rem;
  padding: 28px;
  border-radius: 16px;
  background: var(--background);
  opacity: 0;
  translate: 0 8px;
  transition:
    opacity 300ms var(--ease-settle),
    translate 300ms var(--ease-settle);
}

.frame.on {
  opacity: 1;
  translate: 0;
}

.part {
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition:
    opacity 240ms var(--ease-settle),
    translate 240ms var(--ease-settle);
}

/* What has not happened yet keeps its place, unseen and out of reach. */
.off {
  visibility: hidden;
  opacity: 0;
  translate: 0 6px;
}

/* Except the screen's switch, a real control: it keeps its place in the tab
   order whatever the scroll, out of the pointer's reach until it shows, and
   a keyboard that reaches it lands the whole screen at once. */
.frame-switch.off {
  visibility: visible;
  pointer-events: none;
}

.canvas:focus-within .wait {
  visibility: hidden;
  opacity: 0;
}

.frame:focus-within,
.frame:focus-within .part.off {
  visibility: visible;
  opacity: 1;
  translate: 0;
  pointer-events: auto;
}

.frame-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.frame-n {
  font-size: 1.6rem;
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

.frame-meter {
  gap: 7px;
}

.frame-switch {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--ink);
}

.wait {
  position: absolute;
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
  transition: opacity 240ms var(--ease-settle);
}

/* The session: the ask, then what the agent does, a line at a time. */
.session {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  min-height: 0;
  padding: 32px 32px 32px 8px;
}

.ask {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--ink);
  text-wrap: pretty;
}

.does {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.does li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  color: var(--ink-3);
  transition:
    opacity 240ms var(--ease-settle),
    translate 240ms var(--ease-settle);
}

.does :deep(svg) {
  flex: none;
  color: var(--signal);
}

@media (prefers-reduced-motion: reduce) {
  .frame,
  .part,
  .does li,
  .wait {
    transition: none;
  }
}

@media (max-width: 899px) {
  .stage {
    grid-template-columns: minmax(0, 1fr);
  }
  .canvas {
    padding: 24px 16px 8px;
  }
  .session {
    padding: 16px 24px 28px;
  }
}
</style>
