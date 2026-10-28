<!-- Generated from ../tailwind/LogoLoop.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: { overflow: "hidden" },
  row: { display: "flex", width: "max-content" },
  text: { flexShrink: "0", whiteSpace: "nowrap" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    items?: string[]
    speed?: number
    gap?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { items: () => ["DITHER", "BAYER", "CANVAS", "VUE", "PIXELS"], speed: 18, gap: 48 },
)

// Duplicated once so translateX(-50%) wraps seamlessly.
const loop = computed(() => [...props.items, ...props.items])
</script>

<template>
  <div :class="cn(styles.box, props.xstyle, props.class)" aria-hidden="true">
    <div v-bind="stylex.attrs(styles.row)" class="dither-logoloop" :style="{ animationDuration: `${props.speed}s` }">
      <span
        v-for="(it, i) in loop"
        :key="i"
        v-bind="stylex.attrs(styles.text)"
        :style="{ paddingRight: `${props.gap}px` }"
        >{{ it }}</span
      >
    </div>
  </div>
</template>

<style scoped>
.dither-logoloop {
  animation: dither-loop linear infinite;
  will-change: transform;
}
@keyframes dither-loop {
  to {
    transform: translateX(-50%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .dither-logoloop {
    animation: none;
  }
}
</style>
