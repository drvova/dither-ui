<script lang="ts">
import { BAYER8, bayerMatrix, wipeStyle, type WipeDirection, type WipeOptions, type WipeStyle } from "./wipe"
export type { WipeDirection, WipeOptions, WipeStyle }
export { BAYER8, bayerMatrix, wipeStyle }
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { directedTime, isDirected, onSeek } from "./clock"
import { resolveEasing, type EasingInput } from "./dither-paint"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"
import { useInviewLoop } from "./use-inview-loop"

const props = withDefaults(
  defineProps<{
    /** Manual progress 0-1 (a timeline's); unset, the reveal plays `duration` seconds on the kit clock. */
    progress?: number
    duration?: number
    delay?: number
    /** Where the front travels; "none" dissolves in place. */
    direction?: WipeDirection
    /** Cell size in CSS px. */
    cell?: number
    /** Directional wipes: the dithered band's width in cells. */
    band?: number
    /** A seeded 4x4 matrix instead of the 8x8 Bayer. */
    seed?: number
    /** Hide instead of reveal as progress grows. */
    reverse?: boolean
    easing?: EasingInput
    /** Change to play again. */
    restartKey?: unknown
    class?: string
  }>(),
  { duration: 1.2, delay: 0, direction: "none", cell: 4, band: 12, reverse: false, easing: "ease-in-out" }
)

const wrapRef = ref<HTMLElement | null>(null)
const size = ref({ width: 0, height: 0 })
const played = ref(0)
let raf = 0
let start = 0
let ro: ResizeObserver | null = null

const at = (seconds: number) => Math.max(0, Math.min(1, (seconds - props.delay) / Math.max(0.001, props.duration)))

function tick(now: number) {
  raf = 0
  played.value = at((now - start) / 1000)
  if (played.value < 1) raf = requestAnimationFrame(tick)
}

/** Start or resume the timed reveal (idempotent; a finished reveal stays;
 * a manual `progress` has no clock of its own to run). */
function play() {
  if (props.progress !== undefined || raf || played.value >= 1) return
  if (isDirected()) {
    seekTo(directedTime() ?? 0)
    return
  }
  if (pixelPrefersReducedMotion()) {
    played.value = 1
    return
  }
  start = performance.now() - (props.delay + played.value * props.duration) * 1000
  raf = requestAnimationFrame(tick)
}

function stop() {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

function seekTo(ms: number) {
  stop()
  played.value = at(ms / 1000)
}

function restart() {
  stop()
  played.value = 0
  play()
}

useInviewLoop(wrapRef, play, stop)
watch(() => props.restartKey, restart)
const unseek = onSeek((ms) => (ms === null ? play() : seekTo(ms)))

onMounted(() => {
  const el = wrapRef.value
  if (!el) return
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(([entry]) => {
      if (entry) size.value = { width: entry.contentRect.width, height: entry.contentRect.height }
    })
    ro.observe(el)
  } else requestAnimationFrame(() => (size.value = { width: el.clientWidth, height: el.clientHeight }))
})
onBeforeUnmount(() => {
  unseek()
  stop()
  ro?.disconnect()
})

const effective = computed(() => {
  const raw = props.progress === undefined ? resolveEasing(props.easing)(played.value) : Math.max(0, Math.min(1, props.progress))
  return props.reverse ? 1 - raw : raw
})
const mask = computed(() =>
  wipeStyle(effective.value, { cell: props.cell, seed: props.seed, direction: props.direction, band: props.band, width: size.value.width, height: size.value.height })
)
const style = computed(() =>
  mask.value
    ? {
        maskImage: mask.value.image,
        WebkitMaskImage: mask.value.image,
        maskSize: mask.value.size,
        WebkitMaskSize: mask.value.size,
        maskRepeat: mask.value.repeat,
        WebkitMaskRepeat: mask.value.repeat,
        maskPosition: mask.value.position,
        WebkitMaskPosition: mask.value.position,
      }
    : undefined
)
const state = computed(() => (effective.value >= 1 ? "shown" : effective.value <= 0 ? "hidden" : "playing"))
</script>

<template>
  <div ref="wrapRef" :class="cn('relative', props.class)" :style="style" :data-reveal="state">
    <slot />
  </div>
</template>
