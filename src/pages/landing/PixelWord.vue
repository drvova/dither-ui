<script setup lang="ts">
// A word in the pixel face (`pixel-type.ts`), `cell` px a cell, in the
// current ink: the kit's parts' names, chunky. Decorative: its heading
// carries the name as text.
import { computed } from "vue"
import { layoutPixelText, PIXEL_ROWS } from "./pixel-type"

const { text, cell = 5 } = defineProps<{ text: string; cell?: number }>()
const laid = computed(() => layoutPixelText(text))
</script>

<template>
  <svg
    :viewBox="`0 0 ${laid.width} ${PIXEL_ROWS}`"
    :width="laid.width * cell"
    :height="PIXEL_ROWS * cell"
    aria-hidden="true"
    focusable="false"
    shape-rendering="crispEdges"
  >
    <rect v-for="(c, i) in laid.cells" :key="i" :x="c.x" :y="c.y" width="1" height="1" fill="currentColor" />
  </svg>
</template>
