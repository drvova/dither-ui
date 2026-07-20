<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    text?: string
    amount?: number
    class?: string
  }>(),
  { text: "Scroll float", amount: 1 }
)

const chars = computed(() => [...props.text])
const el = ref<HTMLElement | null>(null)
const progress = ref(0)
let onScroll: (() => void) | null = null

function update() {
  const e = el.value
  if (!e) return
  const r = e.getBoundingClientRect()
  const vh = window.innerHeight || 1
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

// Each char floats up from an offset as it is reached by the scroll progress.
function floatStyle(i: number) {
  const t = Math.max(0, Math.min(1, progress.value * chars.value.length - i * 0.5))
  return {
    opacity: 0.15 + 0.85 * t,
    transform: `translateY(${(1 - t) * 0.7 * props.amount}em)`,
  }
}
</script>

<template>
  <span ref="el" :class="cn('inline-block', props.class)" :aria-label="props.text">
    <span
      v-for="(ch, i) in chars"
      :key="i"
      aria-hidden="true"
      class="dither-float-char"
      :style="floatStyle(i)"
    >{{ ch === " " ? "\u00a0" : ch }}</span>
  </span>
</template>

<style scoped>
.dither-float-char {
  display: inline-block;
  white-space: pre;
  transition: opacity 120ms linear, transform 120ms linear;
}
</style>
