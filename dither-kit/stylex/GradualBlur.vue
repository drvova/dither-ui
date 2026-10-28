<!-- Generated from ../tailwind/GradualBlur.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative" },
  layer: { pointerEvents: "none", position: "absolute", insetInline: "0px" },
  box: { top: "0px" },
  box2: { bottom: "0px" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    position?: "bottom" | "top"
    height?: number
    strength?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { position: "bottom", height: 96, strength: 4 },
)

// Progressive edge blur (iOS-style): a masked backdrop-filter strip so content
// dissolves toward the chosen edge.
const mask = computed(() =>
  props.position === "top"
    ? "linear-gradient(to bottom, black, transparent)"
    : "linear-gradient(to top, black, transparent)",
)
</script>

<template>
  <div :class="cn(styles.frame, props.xstyle, props.class)">
    <slot />
    <div
      :class="cn(styles.layer, props.position === 'top' ? styles.box : styles.box2)"
      :style="{
        height: `${props.height}px`,
        backdropFilter: `blur(${props.strength}px)`,
        WebkitBackdropFilter: `blur(${props.strength}px)`,
        maskImage: mask,
        WebkitMaskImage: mask,
      }"
    />
  </div>
</template>
