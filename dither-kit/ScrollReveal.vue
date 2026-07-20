<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    text?: string
    class?: string
  }>(),
  { text: "Words reveal as you scroll into view" }
)

const words = computed(() => props.text.split(/(\s+)/))
const el = ref<HTMLElement | null>(null)
const progress = ref(0)
let onScroll: (() => void) | null = null

function update() {
  const e = el.value
  if (!e) return
  const r = e.getBoundingClientRect()
  const vh = window.innerHeight || 1
  // 0 when the block sits near the bottom of the viewport, 1 once it has risen
  // through the middle band.
  progress.value = Math.max(0, Math.min(1, 1 - (r.top - vh * 0.2) / (vh * 0.55)))
}

onMounted(() => {
  if (pixelPrefersReducedMotion()) {
    progress.value = 1
    return
  }
  onScroll = () => update()
  window.addEventListener("scroll", onScroll, { passive: true })
  window.addEventListener("resize", onScroll)
  update()
})
onBeforeUnmount(() => {
  if (onScroll) {
    window.removeEventListener("scroll", onScroll)
    window.removeEventListener("resize", onScroll)
  }
})

function reveal(i: number) {
  return Math.max(0.06, Math.min(1, progress.value * words.value.length - i))
}
</script>

<template>
  <span ref="el" :class="cn('inline-block', props.class)" :aria-label="props.text">
    <span
      v-for="(w, i) in words"
      :key="i"
      aria-hidden="true"
      class="dither-reveal-word"
      :style="{ opacity: reveal(i), filter: `blur(${(1 - reveal(i)) * 4}px)`, transform: `translateY(${(1 - reveal(i)) * 0.3}em)` }"
    >{{ /^\s*$/.test(w) ? "\u00a0" : w }}</span>
  </span>
</template>

<style scoped>
.dither-reveal-word {
  display: inline-block;
  white-space: pre;
  transition: opacity 120ms linear, filter 120ms linear, transform 120ms linear;
}
</style>
