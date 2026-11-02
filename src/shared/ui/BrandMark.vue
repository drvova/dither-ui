<script setup lang="ts">
// The brand mark: the 7x7 dithered diamond, ember core, `size` px square;
// given `cells`, another mark on the same grid in the same hand (the close
// mark). Decorative: its link or its place names it.
import { MARK_CELLS } from "./brand-mark"

const props = withDefaults(
  defineProps<{ size: number; cells?: readonly { x: number; y: number; core?: boolean }[] }>(),
  {
    cells: () => MARK_CELLS,
  },
)
</script>

<template>
  <svg
    viewBox="0 0 7 7"
    :width="props.size"
    :height="props.size"
    aria-hidden="true"
    focusable="false"
    shape-rendering="crispEdges"
  >
    <rect
      v-for="c in props.cells"
      :key="`${c.x}.${c.y}`"
      :x="c.x"
      :y="c.y"
      width="1"
      height="1"
      :fill="c.core ? 'var(--signal, var(--swatch-orange))' : 'currentColor'"
    />
  </svg>
</template>
