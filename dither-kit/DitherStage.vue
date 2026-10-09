<script lang="ts">
import type { InjectionKey, Ref } from "vue"
import type { CqBox } from "./keyframes"

/** What layers read from their stage: the moment, the measured box, and
 * whether motion is reduced (every layer then sits at its settled end). */
export type StageContext = { time: Ref<number>; box: Ref<CqBox>; reduced: Ref<boolean> }
export const STAGE: InjectionKey<StageContext> = Symbol("dither-stage")
</script>

<script setup lang="ts">
// A stage: one size query container, one clock. Layers inside run keyframes
// in the stage's units — "20cqw" is a fifth of this box whatever its size —
// and read the stage's moment: free-running it is this rAF loop (visibility
// gated, stop-motion capable, looping over `duration`), directed it is the
// kit clock's, so a stage seeks and exports to video like any surface.
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue"
import { directedTime, isDirected, onSeek } from "./clock"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"
import { frameIndex } from "./timing"
import { useInviewLoop } from "./use-inview-loop"

const props = withDefaults(
  defineProps<{
    /** Seconds of one cycle of the stage's clock (it loops); unset, time runs on. */
    duration?: number
    /** Clock multiplier. */
    speed?: number
    paused?: boolean
    /** Stop-motion cadence in fps (0 = smooth) — see timing.ts. */
    frameRate?: number
    /** Change to restart from 0. */
    restartKey?: unknown
    as?: string
    class?: string
  }>(),
  { speed: 1, paused: false, frameRate: 0, as: "div" },
)

const root = ref<HTMLElement | null>(null)
const time = ref(0)
const box = ref<CqBox>({ width: 0, height: 0 })
const reduced = ref(typeof window !== "undefined" && pixelPrefersReducedMotion())
/** Whether the kit clock holds the moment (reactive for the state attribute). */
const directed = ref(false)
provide(STAGE, { time, box, reduced })

let raf = 0
let last = 0
let elapsed = 0
let lastFrame = -1
let ro: ResizeObserver | null = null

const wrap = (t: number): number => (props.duration && props.duration > 0 ? ((t % props.duration) + props.duration) % props.duration : t)

function frame(now: number): void {
  raf = 0
  if (props.paused || isDirected()) return
  const fps = props.frameRate
  const cap = fps > 0 ? Math.max(0.1, 2 / fps) : 0.1
  const dt = last ? Math.min(cap, (now - last) / 1000) : 0
  last = now
  elapsed += dt * props.speed
  // Stop-motion holds the written moment between boundaries; the clock keeps counting.
  const idx = fps > 0 ? frameIndex(elapsed * 1000, fps) : -1
  if (fps <= 0 || idx !== lastFrame) {
    lastFrame = idx
    time.value = wrap(elapsed)
  }
  raf = requestAnimationFrame(frame)
}

function play(): void {
  if (isDirected()) {
    seekTo(directedTime() ?? 0)
    return
  }
  directed.value = false
  if (reduced.value || props.paused || raf) return
  last = 0
  lastFrame = -1
  raf = requestAnimationFrame(frame)
}

function stop(): void {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

/** Directed: the composition's moment (looped over `duration`), no frames. */
function seekTo(ms: number): void {
  stop()
  directed.value = true
  time.value = wrap((ms / 1000) * props.speed)
}

function restart(): void {
  stop()
  elapsed = 0
  time.value = 0
  play()
}

useInviewLoop(root, play, stop)
const unseek = onSeek((ms) => (ms === null ? play() : seekTo(ms)))
watch(() => props.restartKey, restart)
watch(
  () => props.paused,
  (paused) => (paused ? stop() : play()),
)

onMounted(() => {
  const node = root.value
  if (!node) return
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(([entry]) => {
      if (entry) box.value = { width: entry.contentRect.width, height: entry.contentRect.height }
    })
    ro.observe(node)
  } else box.value = { width: node.clientWidth, height: node.clientHeight }
})
onBeforeUnmount(() => {
  unseek()
  stop()
  ro?.disconnect()
  ro = null
})

const state = computed(() => (reduced.value ? "still" : props.paused ? "paused" : directed.value ? "directed" : "playing"))
const style = computed(() => ({ containerType: "size", containerName: "stage", "--cq-w": String(Math.round(box.value.width)), "--cq-h": String(Math.round(box.value.height)) }))
</script>

<template>
  <component :is="props.as" ref="root" :class="cn('dither-stage', props.class)" :style="style" :data-stage="state" :data-stage-time="time.toFixed(2)">
    <slot :time="time" :width="box.width" :height="box.height" />
  </component>
</template>

<style>
.dither-stage {
  position: relative;
  overflow: hidden;
}
</style>
