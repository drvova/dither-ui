<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    text?: string
    speed?: number
    class?: string
  }>(),
  { text: "DITHER UI \u00b7 CANVAS + BAYER \u00b7 ", speed: 60 }
)

const uid = `dither-curve-${Math.floor(Math.random() * 1e9)}`
const d = "M -100 58 Q 25 18 150 58 T 400 58 T 650 58 T 900 58"
// Repeated enough to always cover the visible path plus one wrap unit.
const content = props.text.repeat(10)

const measure = ref<SVGTextElement | null>(null)
const textPathEl = ref<SVGTextPathElement | null>(null)
let raf = 0
let offset = 0
let copyLen = 0
let lastT = 0

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const el = textPathEl.value
  if (!el || !copyLen) return
  const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0
  lastT = now
  offset -= props.speed * dt
  while (offset <= -copyLen) offset += copyLen
  el.setAttribute("startOffset", String(offset))
}

onMounted(() => {
  copyLen = measure.value?.getComputedTextLength?.() || 0
  if (pixelPrefersReducedMotion()) return
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <svg viewBox="0 0 600 100" :class="cn('w-full', props.class)" :aria-label="props.text">
    <defs>
      <path :id="uid" :d="d" fill="none" />
    </defs>
    <!-- hidden single copy, measured once to wrap the scroll seamlessly -->
    <text ref="measure" class="dither-curve-text" x="-9999" y="-9999">{{ props.text }}</text>
    <text class="dither-curve-text" aria-hidden="true">
      <textPath ref="textPathEl" :href="`#${uid}`" startOffset="0">{{ content }}</textPath>
    </text>
  </svg>
</template>

<style scoped>
.dither-curve-text {
  fill: currentColor;
  font-size: 15px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
</style>
