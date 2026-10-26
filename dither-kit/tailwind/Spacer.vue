<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

/** Sized empty space for flex/grid rows — the alternative to magic margins.
 * `axis="y"` (default) is vertical room, `axis="x"` is horizontal. Purely
 * decorative: always aria-hidden. */
const props = withDefaults(
  defineProps<{
    axis?: "x" | "y"
    size?: "xs" | "sm" | "md" | "lg" | "xl"
    class?: string
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

const classes = computed(() => cn(SPACE[props.size][props.axis], "shrink-0", props.class))
</script>

<template>
  <div aria-hidden="true" :class="classes" />
</template>
