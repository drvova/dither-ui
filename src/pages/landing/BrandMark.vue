<script setup lang="ts">
// The brand mark: the 7x7 dithered diamond, ember core, `size` px square.
// Decorative: its link or its place names it.
import { MARK_CELLS } from "./brand"

defineProps<{ size: number }>()
</script>

<template>
  <svg viewBox="0 0 7 7" :width="size" :height="size" aria-hidden="true" focusable="false" shape-rendering="crispEdges">
    <rect
      v-for="c in MARK_CELLS"
      :key="`${c.x}.${c.y}`"
      :x="c.x"
      :y="c.y"
      width="1"
      height="1"
      :fill="c.core ? 'var(--signal)' : 'currentColor'"
    />
  </svg>
</template>
