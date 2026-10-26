<!-- Generated from ../tailwind/PixelTransition.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", overflow: "hidden" },
  grid: { pointerEvents: "none", position: "absolute", inset: "0px", display: "grid" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    rows?: number
    cols?: number
    color?: string
    class?: string
    xstyle?: StyleProp
  }>(),
  { rows: 6, cols: 10, color: "#111318" },
)

// Deterministic per-cell delay so the dissolve order is stable.
function seeded(i: number) {
  const s = Math.sin(i * 43.21) * 1000
  return s - Math.floor(s)
}
const cells = computed(() => Array.from({ length: Math.max(1, props.rows * props.cols) }, (_, i) => seeded(i) * 300))
</script>

<template>
  <div :class="cn([styles.frame, 'dither-pixeltrans'], props.xstyle, props.class)">
    <slot />
    <div
      v-bind="stylex.attrs(styles.grid)"
      :style="{ gridTemplateColumns: `repeat(${props.cols}, 1fr)`, gridTemplateRows: `repeat(${props.rows}, 1fr)` }"
      aria-hidden="true"
    >
      <span
        v-for="(delay, i) in cells"
        :key="i"
        class="dither-cell"
        :style="{ background: props.color, transitionDelay: `${delay}ms` }"
      />
    </div>
  </div>
</template>

<style scoped>
.dither-cell {
  transition: opacity 260ms ease;
}
.dither-pixeltrans:hover .dither-cell {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .dither-cell {
    transition: none;
  }
}
</style>
