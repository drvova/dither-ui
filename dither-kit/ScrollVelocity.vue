<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    text?: string
    baseSpeed?: number
    class?: string
  }>(),
  { text: "DITHER \u00b7 UI \u00b7 TOOLKIT \u00b7 ", baseSpeed: 60 }
)

// Two identical halves so wrapping by half-width is seamless.
const repeated = computed(() => Array.from({ length: 8 }, () => props.text))
const track = ref<HTMLElement | null>(null)
let raf = 0
let x = 0
let vel = 0
let lastScroll = 0
let lastT = 0
let half = 0

function onScroll() {
  const y = window.scrollY
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

onMounted(() => {
  if (pixelPrefersReducedMotion()) return
  lastScroll = window.scrollY
  window.addEventListener("scroll", onScroll, { passive: true })
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  window.removeEventListener("scroll", onScroll)
})
</script>

<template>
  <div :class="cn('overflow-hidden whitespace-nowrap', props.class)" :aria-label="props.text">
    <div ref="track" class="inline-flex will-change-transform" aria-hidden="true">
      <span v-for="(t, i) in repeated" :key="i" class="pr-6">{{ t }}</span>
    </div>
  </div>
</template>
