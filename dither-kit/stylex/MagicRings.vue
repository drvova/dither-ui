<!-- Generated from ../tailwind/MagicRings.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: { position: "relative", display: "grid", placeItems: "center", overflow: "hidden" },
  layer: { pointerEvents: "none", position: "absolute", borderRadius: "calc(infinity * 1px)" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    color?: string
    count?: number
    duration?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { color: "#7CFF67", count: 4, duration: 3 },
)

const rings = computed(() => Math.max(1, Math.round(props.count)))
</script>

<template>
  <div :class="cn(styles.grid, props.xstyle, props.class)">
    <slot />
    <span
      v-for="i in rings"
      :key="i"
      v-bind="stylex.attrs(styles.layer)"
      class="dither-ring"
      :style="{
        borderColor: props.color,
        animationDuration: `${props.duration}s`,
        animationDelay: `${-((i - 1) * props.duration) / rings}s`,
      }"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.dither-ring {
  width: 40px;
  height: 40px;
  border: 2px solid;
  animation: dither-ring-expand ease-out infinite;
}
@keyframes dither-ring-expand {
  0% {
    transform: scale(0.2);
    opacity: 0.9;
  }
  100% {
    transform: scale(6);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dither-ring {
    animation: none;
    opacity: 0.3;
  }
}
</style>
