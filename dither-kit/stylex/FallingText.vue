<!-- Generated from ../tailwind/FallingText.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline-block" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    text?: string
    stagger?: number
    duration?: number
    replayToken?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { text: "Falling text", stagger: 45, duration: 700 },
)

const chars = computed(() => [...props.text])
const runKey = computed(() => `${props.text}-${props.replayToken ?? 0}`)
</script>

<template>
  <span :key="runKey" :class="cn(styles.text, props.xstyle, props.class)" :aria-label="props.text">
    <span
      v-for="(ch, i) in chars"
      :key="i"
      aria-hidden="true"
      class="dither-fall-char"
      :style="{ animationDelay: `${i * props.stagger}ms`, animationDuration: `${props.duration}ms` }"
      >{{ ch === " " ? "\u00a0" : ch }}</span
    >
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
