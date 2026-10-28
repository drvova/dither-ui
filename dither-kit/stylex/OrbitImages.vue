<!-- Generated from ../tailwind/OrbitImages.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: { position: "relative", display: "grid", placeItems: "center" },
  layer: { position: "absolute", inset: "0px" },
  grid2: {
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    left: "calc(1 / 2 * 100%)",
    display: "grid",
    height: "2.25rem",
    width: "2.25rem",
    placeItems: "center",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "var(--card)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
  },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    items?: string[]
    radius?: number
    duration?: number
    size?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { items: () => ["A", "B", "C", "D", "E"], radius: 80, duration: 16, size: 200 },
)

const placed = computed(() => {
  const n = props.items.length || 1
  return props.items.map((it, i) => {
    const a = (i / n) * Math.PI * 2
    return { it, x: Math.sin(a) * props.radius, y: -Math.cos(a) * props.radius }
  })
})
</script>

<template>
  <div
    :class="cn(styles.grid, props.xstyle, props.class)"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
    aria-hidden="true"
  >
    <div v-bind="stylex.attrs(styles.layer)" class="dither-orbit" :style="{ animationDuration: `${props.duration}s` }">
      <span
        v-for="(p, i) in placed"
        :key="i"
        v-bind="stylex.attrs(styles.grid2)"
        :style="{ transform: `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)` }"
      >
        <span class="dither-orbit-label" :style="{ animationDuration: `${props.duration}s` }">{{ p.it }}</span>
      </span>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.dither-orbit {
  animation: dither-orbit-spin linear infinite;
}
@keyframes dither-orbit-spin {
  to {
    transform: rotate(360deg);
  }
}
.dither-orbit-label {
  display: block;
  animation: dither-orbit-counter linear infinite;
}
@keyframes dither-orbit-counter {
  to {
    transform: rotate(-360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .dither-orbit,
  .dither-orbit-label {
    animation: none;
  }
}
</style>
