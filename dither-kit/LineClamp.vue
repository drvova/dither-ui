<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

/** Clamped block with a real ellipsis after N lines (1–6). */
const props = withDefaults(
  defineProps<{ lines?: 1 | 2 | 3 | 4 | 5 | 6; as?: string; class?: string }>(),
  { lines: 3, as: "p" },
)

// Literal classes so Tailwind ships every variant.
const CLAMPS = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
} as const

const classes = computed(() => cn(CLAMPS[props.lines], props.class))
</script>

<template>
  <component :is="props.as" :class="classes"><slot /></component>
</template>
