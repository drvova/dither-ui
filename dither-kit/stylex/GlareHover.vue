<!-- Generated from ../tailwind/GlareHover.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", display: "inline-block", overflow: "hidden", borderRadius: "12px" },
  layer: { pointerEvents: "none", position: "absolute", inset: "0px" },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

const props = defineProps<{ class?: string; xstyle?: StyleProp }>()
</script>

<template>
  <div :class="cn([styles.frame, 'dither-glare'], props.xstyle, props.class)">
    <slot />
    <div v-bind="stylex.attrs(styles.layer)" class="glare" aria-hidden="true" />
  </div>
</template>

<style scoped>
/* A full-cover diagonal shine that sweeps across on hover; the parent's
   overflow-hidden clips it, so the stripe reads as a single glare pass. */
.glare {
  background: linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.5) 50%, transparent 65%);
  transform: translateX(-100%);
  transition: transform 700ms ease;
  will-change: transform;
}
.dither-glare:hover .glare {
  transform: translateX(100%);
}
@media (prefers-reduced-motion: reduce) {
  .glare {
    transition: none;
  }
}
</style>
