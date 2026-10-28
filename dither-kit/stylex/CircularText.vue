<!-- Generated from ../tailwind/CircularText.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: { display: "inline-grid", placeItems: "center" },
  svg: { height: "100%", width: "100%" },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    text?: string
    duration?: number
    size?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { text: "DITHER \u00b7 UI \u00b7 TOOLKIT \u00b7 ", duration: 12, size: 170 },
)

const uid = `dither-circle-${Math.floor(Math.random() * 1e9)}`
const R = 40
// Full circle as two arcs, drawn clockwise from the left point.
const d = `M 50 50 m -${R} 0 a ${R} ${R} 0 1 1 ${R * 2} 0 a ${R} ${R} 0 1 1 -${R * 2} 0`
</script>

<template>
  <div
    :class="cn(styles.grid, props.xstyle, props.class)"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
    :aria-label="props.text"
  >
    <svg
      viewBox="0 0 100 100"
      v-bind="stylex.attrs(styles.svg)"
      class="dither-circular-svg"
      :style="{ animationDuration: `${props.duration}s` }"
      aria-hidden="true"
    >
      <defs>
        <path :id="uid" :d="d" fill="none" />
      </defs>
      <text class="dither-circular-text">
        <textPath :href="`#${uid}`" startOffset="0">{{ props.text }}</textPath>
      </text>
    </svg>
  </div>
</template>

<style scoped>
.dither-circular-svg {
  animation: dither-spin linear infinite;
  transform-origin: center;
}
@keyframes dither-spin {
  to {
    transform: rotate(360deg);
  }
}
.dither-circular-text {
  fill: currentColor;
  font-size: 7px;
  letter-spacing: 1.4px;
  text-transform: uppercase;
}
@media (prefers-reduced-motion: reduce) {
  .dither-circular-svg {
    animation: none;
  }
}
</style>
