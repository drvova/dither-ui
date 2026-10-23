<script setup lang="ts">
// Motion: the preview's CSS and Web animations (play, pause, slow down,
// scrub), and — beyond Kobra — the kit clock that every dithered surface
// runs on: hold it at a moment, step frame by frame, release it. The clock
// is page-wide (every preview on the page holds with it), and says so.
import { onBeforeUnmount, onMounted, ref } from "vue"
import { directedTime, isDirected, release, seek } from "@dither-kit"
import { useBench } from "../context"
import { labelOf } from "../model/measure"
import { ICONS } from "../model/tools"
import Icon from "./Icon.vue"

const b = useBench()
type Row = { anim: Animation; name: string; target: string; duration: number; iterations: string; state: string }
const rows = ref<Row[]>([])
const scrub = ref(0)
const span = ref(1000)
const rate = ref(1)
const RATES = [0.1, 0.25, 0.5, 1]
const FRAME = 1000 / 30
const held = ref(isDirected())
const at = ref(directedTime() ?? 0)

function nameOf(a: Animation): string {
  if (typeof CSSAnimation !== "undefined" && a instanceof CSSAnimation) return a.animationName
  if (typeof CSSTransition !== "undefined" && a instanceof CSSTransition) return `transition: ${a.transitionProperty}`
  return a.id || "animation"
}

function scan() {
  const list = typeof document.getAnimations === "function" ? document.getAnimations() : []
  rows.value = list
    .filter((a) => {
      const t = (a.effect as KeyframeEffect | null)?.target
      return t instanceof Element && b.o.content.contains(t)
    })
    .map((a) => {
      const timing = a.effect!.getComputedTiming()
      const el = (a.effect as KeyframeEffect).target as Element
      return {
        anim: a,
        name: nameOf(a),
        target: labelOf(el),
        duration: Number(timing.duration) || 0,
        iterations: timing.iterations === Infinity ? "∞" : String(timing.iterations),
        state: a.playState,
      }
    })
  span.value = Math.max(1000, ...rows.value.map((r) => r.duration))
}

let timer = 0
onMounted(() => {
  scan()
  timer = window.setInterval(scan, 600)
})
onBeforeUnmount(() => clearInterval(timer))

function playAll(play: boolean) {
  for (const r of rows.value) play ? r.anim.play() : r.anim.pause()
  scan()
  b.say(play ? "Animations playing" : "Animations paused")
}

function setRate(v: number) {
  rate.value = v
  for (const r of rows.value) r.anim.updatePlaybackRate(v)
  b.say(`Playback at ${v}×`)
}

function seekAll(ms: number) {
  scrub.value = ms
  for (const r of rows.value) {
    r.anim.pause()
    const end = Number(r.anim.effect?.getComputedTiming().endTime)
    r.anim.currentTime = Number.isFinite(end) ? Math.min(ms, end) : ms
  }
  scan()
}

function hold(ms: number) {
  at.value = Math.max(0, ms)
  seek(at.value)
  held.value = true
}

function free() {
  release()
  held.value = false
  b.say("Kit clock released")
}
</script>

<template>
  <section class="wb-motion" aria-label="Motion">
    <header class="row">
      <span class="micro">Motion</span>
      <span class="dim">{{ rows.length }} animation{{ rows.length === 1 ? "" : "s" }} in this preview</span>
      <span class="spacer" />
      <button type="button" class="act" aria-label="Play every animation" @click="playAll(true)">
        <Icon :d="ICONS.play" :size="12" />
      </button>
      <button type="button" class="act" aria-label="Pause every animation" @click="playAll(false)">
        <Icon :d="ICONS.pause" :size="12" />
      </button>
      <div class="seg" role="group" aria-label="Playback rate">
        <button v-for="r in RATES" :key="r" type="button" :aria-pressed="rate === r" @click="setRate(r)">
          {{ r }}×
        </button>
      </div>
    </header>
    <label v-if="rows.length" class="row scrub">
      <span class="dim">scrub</span>
      <input
        type="range"
        min="0"
        :max="span"
        step="1"
        :value="scrub"
        aria-label="Scrub every animation"
        @input="seekAll(+($event.target as HTMLInputElement).value)"
      />
      <span class="num">{{ (scrub / 1000).toFixed(2) }} s</span>
    </label>
    <table v-if="rows.length" class="list">
      <thead>
        <tr>
          <th class="micro">animation</th>
          <th class="micro">on</th>
          <th class="micro">duration</th>
          <th class="micro">loops</th>
          <th class="micro">state</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r, i) in rows" :key="i">
          <td>{{ r.name }}</td>
          <td class="dim">{{ r.target }}</td>
          <td>{{ r.duration }} ms</td>
          <td>{{ r.iterations }}</td>
          <td class="dim">{{ r.state }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else class="dim">No CSS or Web animations here — canvas surfaces run on the kit clock below.</p>

    <div class="clock">
      <div class="row">
        <span class="micro">Kit clock</span>
        <span class="dim"
          >every dithered surface on the page · {{ held ? `held at ${(at / 1000).toFixed(3)} s` : "running" }}</span
        >
        <span class="spacer" />
        <button type="button" class="act" aria-label="Back one frame" @click="hold(at - FRAME)">
          <Icon :d="ICONS.back" :size="12" />
        </button>
        <button type="button" class="act" :aria-pressed="held" @click="held ? free() : hold(at)">
          <Icon :d="held ? ICONS.play : ICONS.pause" :size="12" /> {{ held ? "Release" : "Hold" }}
        </button>
        <button type="button" class="act" aria-label="Forward one frame" @click="hold(at + FRAME)">
          <Icon :d="ICONS.step" :size="12" />
        </button>
      </div>
      <label class="row scrub">
        <span class="dim">time</span>
        <input
          type="range"
          min="0"
          max="10000"
          step="1"
          :value="at"
          aria-label="Kit clock time"
          @input="hold(+($event.target as HTMLInputElement).value)"
        />
        <span class="num">{{ (at / 1000).toFixed(3) }} s</span>
      </label>
    </div>
  </section>
</template>

<style scoped>
.wb-motion,
.clock {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wb-motion {
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
  border-radius: 8px;
  font-size: 11px;
}

.clock {
  padding-top: 8px;
  border-top: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.spacer {
  flex: 1;
}

.dim {
  color: var(--color-muted-foreground);
}

.scrub input {
  flex: 1;
  min-width: 120px;
  accent-color: var(--color-foreground);
}

.num {
  min-width: 64px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.act,
.seg > button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 24px;
  min-height: 24px;
  padding: 0 7px;
  border-radius: 5px;
  color: var(--color-muted-foreground);
  box-shadow: inset 0 0 0 1px var(--color-border);
}

.act:hover,
.seg > button:hover {
  color: var(--color-foreground);
}

.act[aria-pressed="true"],
.seg > button[aria-pressed="true"] {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 6%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-foreground) 24%, transparent);
}

.seg {
  display: flex;
  gap: 3px;
}

.seg > button {
  box-shadow: none;
}

.list {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

.list th {
  padding: 0 8px 4px 0;
  color: var(--color-muted-foreground);
  text-align: left;
}

.list td {
  padding: 3px 8px 3px 0;
  border-top: 1px solid color-mix(in oklab, var(--color-border) 50%, transparent);
}
</style>
