<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    text?: string
    by?: "words" | "chars"
    stagger?: number
    duration?: number
    class?: string
  }>(),
  { text: "Blur into focus", by: "words", stagger: 90, duration: 600 }
)

const parts = computed(() => (props.by === "chars" ? [...props.text] : props.text.split(/(\s+)/)))
const el = ref<HTMLElement | null>(null)
const shown = ref(false)
let io: IntersectionObserver | null = null

onMounted(() => {
  if (pixelPrefersReducedMotion() || typeof IntersectionObserver === "undefined") {
    shown.value = true
    return
  }
  io = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) {
      shown.value = true
      io?.disconnect()
    }
  })
  if (el.value) io.observe(el.value)
})
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <span ref="el" :class="cn('inline-block', props.class)" :aria-label="props.text">
    <span
      v-for="(p, i) in parts"
      :key="i"
      aria-hidden="true"
      class="dither-blur-part"
      :class="{ shown }"
      :style="{ transitionDelay: `${i * props.stagger}ms`, transitionDuration: `${props.duration}ms` }"
    >{{ /^\s*$/.test(p) ? "\u00a0" : p }}</span>
  </span>
</template>

<style scoped>
.dither-blur-part {
  display: inline-block;
  white-space: pre;
  opacity: 0;
  filter: blur(8px);
  transform: translateY(6px);
  transition-property: opacity, filter, transform;
  transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
}
.dither-blur-part.shown {
  opacity: 1;
  filter: blur(0);
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .dither-blur-part {
    opacity: 1;
    filter: none;
    transform: none;
    transition: none;
  }
}
</style>
