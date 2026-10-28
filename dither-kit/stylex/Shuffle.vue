<!-- Generated from ../tailwind/Shuffle.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
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
  { text: "Shuffle in", stagger: 55, duration: 650 },
)

// Deterministic per-character random offset so the shuffle is stable per render.
function seeded(i: number, salt: number) {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return s - Math.floor(s)
}
const chars = computed(() =>
  [...props.text].map((ch, i) => ({
    ch: ch === " " ? "\u00a0" : ch,
    dx: (seeded(i, 1) - 0.5) * 2, // -1..1 em
    dy: (seeded(i, 2) - 0.5) * 1.4,
    rot: (seeded(i, 3) - 0.5) * 40,
  })),
)
const runKey = computed(() => `${props.text}-${props.replayToken ?? 0}`)
</script>

<template>
  <span :key="runKey" :class="cn(styles.text, props.xstyle, props.class)" :aria-label="props.text">
    <span
      v-for="(c, i) in chars"
      :key="i"
      aria-hidden="true"
      class="dither-shuffle-char"
      :style="{
        animationDelay: `${i * props.stagger}ms`,
        animationDuration: `${props.duration}ms`,
        '--dx': `${c.dx}em`,
        '--dy': `${c.dy}em`,
        '--rot': `${c.rot}deg`,
      }"
      >{{ c.ch }}</span
    >
  </span>
</template>

<style scoped>
.dither-shuffle-char {
  display: inline-block;
  white-space: pre;
  animation: dither-shuffle-in cubic-bezier(0.2, 0.8, 0.2, 1) both;
  will-change: transform, opacity;
}
@keyframes dither-shuffle-in {
  from {
    opacity: 0;
    transform: translate(var(--dx), var(--dy)) rotate(var(--rot));
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dither-shuffle-char {
    animation: none;
  }
}
</style>
