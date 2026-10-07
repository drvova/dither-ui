<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"
import { useInviewLoop } from "./use-inview-loop"

const props = withDefaults(
  defineProps<{
    text?: string
    baseSpeed?: number
    class?: string
  }>(),
  { text: "DITHER · UI · TOOLKIT · ", baseSpeed: 60 }
)

// Two identical halves so wrapping by half-width is seamless.
const repeated = computed(() => Array.from({ length: 8 }, () => props.text))
const host = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
let raf = 0
let x = 0
let vel = 0
let lastScroll = 0
let lastT = 0
let half = 0

function onScroll() {
  const y = window.scrollY
  // While the loop is paused (element offscreen) keep the baseline fresh but
  // never accrue velocity — a resume must not fire a stale scroll impulse.
  if (!raf) {
    lastScroll = y
    return
  }
  vel += y - lastScroll
  lastScroll = y
}
function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const el = track.value
  if (!el) return
  if (!half) half = el.scrollWidth / 2 || 1
  const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0
  lastT = now
  x -= (props.baseSpeed + vel * 4) * dt
  vel *= 0.9
  while (x <= -half) x += half
  while (x > 0) x -= half
  el.style.transform = `translateX(${x}px)`
}

function start() {
  if (raf || pixelPrefersReducedMotion()) return
  lastScroll = window.scrollY
  raf = requestAnimationFrame(frame)
}
function stop() {
  if (!raf) return
  cancelAnimationFrame(raf)
  raf = 0
  vel = 0
}

onMounted(() => {
  if (pixelPrefersReducedMotion()) return
  lastScroll = window.scrollY
  window.addEventListener("scroll", onScroll, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll)
})
useInviewLoop(host, start, stop)
</script>

<template>
  <div ref="host" :class="cn('overflow-hidden whitespace-nowrap', props.class)" :aria-label="props.text">
    <div ref="track" class="inline-flex will-change-transform" aria-hidden="true">
      <span v-for="(t, i) in repeated" :key="i" class="pr-6">{{ t }}</span>
    </div>
  </div>
</template>
