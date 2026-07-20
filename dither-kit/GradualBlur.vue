<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    position?: "bottom" | "top"
    height?: number
    strength?: number
    class?: string
  }>(),
  { position: "bottom", height: 96, strength: 4 }
)

// Progressive edge blur (iOS-style): a masked backdrop-filter strip so content
// dissolves toward the chosen edge.
const mask = computed(() =>
  props.position === "top"
    ? "linear-gradient(to bottom, black, transparent)"
    : "linear-gradient(to top, black, transparent)"
)
</script>

<template>
  <div :class="cn('relative', props.class)">
    <slot />
    <div
      class="pointer-events-none absolute inset-x-0"
      :class="props.position === 'top' ? 'top-0' : 'bottom-0'"
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
