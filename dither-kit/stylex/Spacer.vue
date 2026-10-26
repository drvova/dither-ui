<!-- Generated from ../tailwind/Spacer.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  shrink0: { flexShrink: "0" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

/** Sized empty space for flex/grid rows — the alternative to magic margins.
 * `axis="y"` (default) is vertical room, `axis="x"` is horizontal. Purely
 * decorative: always aria-hidden. */
const props = withDefaults(
  defineProps<{
    axis?: "x" | "y"
    size?: "xs" | "sm" | "md" | "lg" | "xl"
    class?: string
    xstyle?: StyleProp
  }>(),
  { axis: "y", size: "md" },
)

// Literal class strings so Tailwind ships every variant.
const SPACE = {
  xs: { y: "h-[4px]", x: "w-[4px]" },
  sm: { y: "h-[8px]", x: "w-[8px]" },
  md: { y: "h-[16px]", x: "w-[16px]" },
  lg: { y: "h-[24px]", x: "w-[24px]" },
  xl: { y: "h-[40px]", x: "w-[40px]" },
} as const

const classes = computed(() => cn(SPACE[props.size][props.axis], styles.shrink0, props.xstyle, props.class))
</script>

<template>
  <div aria-hidden="true" :class="cn(classes)" />
</template>
