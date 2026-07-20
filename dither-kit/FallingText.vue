<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    text?: string
    stagger?: number
    duration?: number
    replayToken?: number
    class?: string
  }>(),
  { text: "Falling text", stagger: 45, duration: 700 }
)

const chars = computed(() => [...props.text])
const runKey = computed(() => `${props.text}-${props.replayToken ?? 0}`)
</script>

<template>
  <span :key="runKey" :class="cn('inline-block', props.class)" :aria-label="props.text">
    <span
      v-for="(ch, i) in chars"
      :key="i"
      aria-hidden="true"
      class="dither-fall-char"
      :style="{ animationDelay: `${i * props.stagger}ms`, animationDuration: `${props.duration}ms` }"
    >{{ ch === " " ? "\u00a0" : ch }}</span>
  </span>
</template>

<style scoped>
.dither-fall-char {
  display: inline-block;
  white-space: pre;
  animation: dither-fall cubic-bezier(0.3, 1.4, 0.5, 1) both;
  will-change: transform, opacity;
}
@keyframes dither-fall {
  0% {
    opacity: 0;
    transform: translateY(-0.9em) rotate(-9deg);
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dither-fall-char {
    animation: none;
  }
}
</style>
