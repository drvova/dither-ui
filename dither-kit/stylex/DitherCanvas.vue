<!-- Generated from ../tailwind/DitherCanvas.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: {
    position: "relative",
    minHeight: "0px",
    overflow: "auto",
    backgroundColor: "color-mix(in oklab, var(--background) 40%, transparent)",
  },
  layer: { pointerEvents: "none", position: "absolute", inset: "0px", opacity: "40%" },
  frame2: { position: "relative" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

/** Work-surface backdrop — the dotted or ruled field a dashboard sits on.
 * Pure CSS: the pattern inks with the border token and stays behind content. */
const props = withDefaults(
  defineProps<{
    pattern?: "dots" | "grid" | "plain"
    /** Pattern pitch in CSS pixels. */
    cell?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { pattern: "dots", cell: 16 },
)

const layer = computed(() => {
  const c = `${props.cell}px`
  if (props.pattern === "dots")
    return {
      backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
      backgroundSize: `${c} ${c}`,
    }
  if (props.pattern === "grid")
    return {
      backgroundImage:
        "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
      backgroundSize: `${c} ${c}`,
    }
  return {}
})
</script>

<template>
  <div :class="cn(styles.frame, props.xstyle, props.class)">
    <div aria-hidden="true" v-bind="stylex.attrs(styles.layer)" :style="layer" />
    <div v-bind="stylex.attrs(styles.frame2)">
      <slot />
    </div>
  </div>
</template>
