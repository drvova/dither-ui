<script setup lang="ts">
import { computed, ref } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    text?: string
    stagger?: number
    duration?: number
    replayToken?: number
    class?: string
  }>(),
  { text: "Split text", stagger: 40, duration: 600 }
)

const chars = computed(() => [...props.text])
// A key that changes on replay so the enter animation runs again.
const runKey = computed(() => `${props.text}-${props.replayToken ?? 0}`)
const rootRef = ref<HTMLElement | null>(null)
</script>

<template>
  <span ref="rootRef" :key="runKey" :class="cn('inline-block', props.class)" :aria-label="props.text">
    <span
      v-for="(ch, i) in chars"
      :key="i"
      aria-hidden="true"
      class="dither-split-char"
      :style="{ animationDelay: `${i * props.stagger}ms`, animationDuration: `${props.duration}ms` }"
    >{{ ch === " " ? "\u00a0" : ch }}</span>
  </span>
</template>

<style scoped>
.dither-split-char {
  display: inline-block;
  animation: dither-split-in cubic-bezier(0.2, 0, 0, 1) both;
  will-change: transform, opacity;
}
@keyframes dither-split-in {
  from {
    opacity: 0;
    transform: translateY(0.55em) rotate(6deg);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dither-split-char {
    animation: none;
  }
}
</style>
