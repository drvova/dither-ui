<script setup lang="ts">
// The ask as a story: a stage pinned while the page scrolls past it plays
// one agent session (`story.ts`), a step per notch. The ask arrives in the
// session panel, each Studio tool call lands there with its time and what it
// returned, the frame builds on the Studio's dotted canvas part by part
// (drawn selected, as the Studio draws a selection), and it leaves as a Vue
// file and an MP4. Chapter tabs under the stage (Ask, Tool calls, Frame,
// Export) show where the story is and jump to a chapter. The step is the
// marker crossing the viewport's middle (one IntersectionObserver, no
// scroll listener). Under 900px, or without an observer, the stage is not
// pinned and shows the whole session at once. Screen readers get the whole
// session as a list; the panel that plays it is decoration.
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue"
import { DitherHeading, DitherIcon, DitherNumberText, DitherProgress, DitherSwitch, DitherText } from "@dither-kit"
import { ASK, CALLS, CHAPTERS, CODE, PARTS, STEPS } from "./story"

const HANDLES = ["tl", "tr", "bl", "br"] as const
const LAST = STEPS - 1

const step = ref(LAST)
const pinned = ref(false)
const chapter = computed(() => CHAPTERS.reduce((at, c) => (step.value >= c.from ? c : at), CHAPTERS[0]))
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

// A chapter tab scrolls its first step to the viewport's middle.
function go(from: number) {
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  markers.value[from]?.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" })
}
</script>

<template>
  <div class="story" :class="{ pinned }" :style="{ '--steps': STEPS }">
    <figure id="agent-ask" class="pin">
      <div class="stage">
        <div class="canvas">
          <div class="board" :class="{ on: step >= PARTS.count }">
            <span class="board-name"
              ><span>Deploys</span
              ><span class="board-tags"
                ><span class="speed-tag" :class="{ off: step < 6 }">Vue file</span
                ><span class="speed-tag" :class="{ off: step < 7 }">MP4</span></span
              ></span
            >
            <div class="board-frame">
              <span v-for="c in HANDLES" :key="c" class="handle" :class="c" aria-hidden="true"></span>
              <div class="part" :class="{ off: step < PARTS.count }">
                <DitherHeading level="3">Deploys</DitherHeading>
                <div class="board-row">
                  <DitherNumberText :value="16" class="board-n" />
                  <DitherText tone="muted" size="xs">deploys this week</DitherText>
                </div>
              </div>
              <div class="part board-meter" :class="{ off: step < PARTS.meter }">
                <DitherText tone="muted" size="xs">Build minutes, 64% used</DitherText>
                <DitherProgress :value="64" color="blue" aria-label="Build minutes" />
              </div>
              <div class="part board-switch" :class="{ off: step < PARTS.toggle }">
                <DitherSwitch v-model="auto" label="Auto deploy" />
                <span aria-hidden="true">Auto deploy</span>
              </div>
            </div>
          </div>
          <p class="wait" :class="{ off: step >= PARTS.count }" aria-hidden="true">
            <DitherIcon name="Sparkles" :size="13" :stroke-width="1.5" />The canvas waits for the first frame.
          </p>
        </div>

        <!-- The session as it plays: decoration over the list under it. -->
        <div class="session" aria-hidden="true">
          <p class="bubble"><span class="caret">›</span>{{ ASK }}</p>
          <ol class="calls">
            <li v-for="c in CALLS" :key="c.tool" class="call" :class="{ off: step < c.step, done: step >= c.done }">
              <span class="call-head"
                ><span class="call-at">{{ c.at }}</span
                ><code class="call-t">{{ c.tool }}</code
                ><code class="call-args">{{ c.args }}</code></span
              >
              <span class="call-r"
                ><DitherIcon :name="step >= c.done ? 'Check' : 'Clock'" :size="12" :stroke-width="1.75" />{{
                  step >= c.done ? c.result : "running"
                }}</span
              >
              <pre v-if="c.tool === 'get_code'" class="code"><code v-for="l in CODE" :key="l">{{ l }}</code></pre>
              <code v-if="c.tool === 'export_video'" class="cmd"
                ><span class="cmd-p">$</span> npx hyperframes render</code
              >
            </li>
          </ol>
        </div>
      </div>

      <div class="foot">
        <div class="seg track chapters" role="group" aria-label="Chapters">
          <button v-for="c in CHAPTERS" :key="c.label" type="button" :aria-pressed="chapter === c" @click="go(c.from)">
            {{ c.label }}
          </button>
        </div>
        <span class="rule" aria-hidden="true"><span class="fill" :style="{ scale: `${(step + 1) / STEPS} 1` }" /></span>
      </div>

      <figcaption class="sr-only">
        The session: you ask for {{ ASK }}.
        <span v-for="c in CALLS" :key="c.tool">The agent calls {{ c.tool }} and gets {{ c.result }}. </span>
        The frame lands on the canvas, then leaves as a Vue file and an MP4.
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
  --pin: min(calc(100svh - 96px), 40rem);
  position: relative;
}

.story.pinned {
  height: calc(var(--steps) * var(--notch) + var(--pin));
}

.pin {
  display: flex;
  flex-direction: column;
  gap: 14px;
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

/* The stage: the canvas (the Studio's dots) beside the session panel. */
.stage {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 24rem);
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--well);
}

.canvas {
  position: relative;
  display: grid;
  place-items: center;
  padding: 32px 24px;
  background: radial-gradient(circle, color-mix(in oklab, var(--line) 90%, transparent) 1px, transparent 1.2px) 0 0 /
    16px 16px;
}

.board {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: min(100%, 28rem);
  opacity: 0;
  translate: 0 8px;
  transition:
    opacity 300ms var(--ease-settle),
    translate 300ms var(--ease-settle);
}

.board.on {
  opacity: 1;
  translate: 0;
}

.board-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 20px;
  font-size: 11px;
  color: var(--ink-3);
}

.board-tags {
  display: flex;
  gap: 4px;
}

.board-frame {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  min-height: 15rem;
  padding: 24px;
  border-radius: 10px;
  background: var(--background);
  box-shadow:
    0 0 0 2px var(--accent),
    var(--float-shadow);
}

.handle {
  position: absolute;
  width: 10px;
  height: 10px;
  border: 1px solid var(--accent);
  border-radius: 2px;
  background: var(--background);
}

.handle.tl {
  top: -6px;
  left: -6px;
}

.handle.tr {
  top: -6px;
  right: -6px;
}

.handle.bl {
  bottom: -6px;
  left: -6px;
}

.handle.br {
  right: -6px;
  bottom: -6px;
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

.board-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.board-n {
  font-size: 1.6rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

.board-meter {
  gap: 7px;
}

.board-switch {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--ink-2);
}

.wait {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
  transition: opacity 240ms var(--ease-settle);
}

/* The session panel: the ask in a bubble, then each call as a card. */
.session {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 22px 20px;
  overflow: hidden;
  background: var(--shell-ground), var(--background);
  box-shadow: inset 1px 0 0 var(--line);
}

.bubble {
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 10px 14px;
  border-radius: 14px 14px 14px 4px;
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--ink);
  background: color-mix(in oklab, var(--foreground) 6%, transparent);
  box-shadow: inset 0 0 0 1px var(--line);
}

.caret {
  color: var(--signal);
}

.calls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.call {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--well);
  box-shadow: inset 0 0 0 1px var(--line);
  transition:
    opacity 240ms var(--ease-settle),
    translate 240ms var(--ease-settle);
}

.call-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
  font-size: 11.5px;
}

.call-at {
  font-variant-numeric: tabular-nums;
  color: var(--ink-3);
}

.call-t {
  color: var(--ink);
}

.call-args {
  color: var(--ink-3);
}

.call-r {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--ink-2);
}

.call.done .call-r :deep(svg) {
  color: var(--signal);
}

.code {
  margin: 2px 0 0;
  padding: 8px 10px;
  overflow: hidden;
  border-radius: 6px;
  font-size: 10.5px;
  line-height: 1.6;
  white-space: pre;
  text-overflow: ellipsis;
  color: var(--ink-2);
  background: color-mix(in oklab, var(--background) 70%, transparent);
}

.code code {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cmd {
  font-size: 11px;
  color: var(--ink-2);
}

.cmd-p {
  color: var(--signal);
}

/* The foot: the chapter tabs, and the story's progress under them. */
.foot {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.rule {
  position: relative;
  align-self: stretch;
  height: 1px;
  overflow: hidden;
  background: var(--line);
}

.fill {
  position: absolute;
  inset: 0;
  transform-origin: left;
  background: var(--ink-3);
  transition: scale 300ms var(--ease-settle);
}

@media (prefers-reduced-motion: reduce) {
  .board,
  .part,
  .call,
  .wait,
  .fill {
    transition: none;
  }
}

/* Unpinned (under 900px, or without an observer): the whole session, the
   canvas over the panel, the tabs and the rule gone. */
.story:not(.pinned) .foot {
  display: none;
}

@media (max-width: 899px) {
  .stage {
    grid-template-columns: minmax(0, 1fr);
  }
  .canvas {
    padding: 28px 16px;
  }
  .session {
    box-shadow: inset 0 1px 0 var(--line);
  }
}
</style>
