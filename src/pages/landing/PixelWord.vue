<script setup lang="ts">
// A string set in the page's pixel face (`pixel-type.ts`): crisp SVG cells
// with a hairline seam between them, sized by `cell` (CSS px per cell). The
// first `accent` characters take the ember — the reference's lit initial.
// It reads as its own text (`role="img"`) unless `decorative`.
import { computed } from "vue"
import { layoutPixelText, PIXEL_ROWS } from "./pixel-type"

const props = withDefaults(defineProps<{ text: string; cell?: number; seam?: number; accent?: number; decorative?: boolean }>(), {
  cell: 3,
  seam: 0.16,
  accent: 0,
  decorative: false,
})

const art = computed(() => {
  const { cells, width } = layoutPixelText(props.text)
  const s = 1 - props.seam
  const o = props.seam / 2
  const d = (lit: boolean) =>
    cells
      .filter((c) => c.char < props.accent === lit)
      .map((c) => `M${c.x + o} ${c.y + o}h${s}v${s}h-${s}z`)
      .join("")
  return { width, base: d(false), lit: d(true) }
})
</script>

<template>
  <svg
    :viewBox="`0 0 ${art.width} ${PIXEL_ROWS}`"
    :width="art.width * cell"
    :height="PIXEL_ROWS * cell"
    class="pixel-word"
    :role="decorative ? undefined : 'img'"
    :aria-label="decorative ? undefined : text"
    :aria-hidden="decorative ? 'true' : undefined"
    focusable="false"
    shape-rendering="crispEdges"
  >
    <path v-if="art.lit" :d="art.lit" fill="var(--swatch-orange)" />
    <path :d="art.base" fill="currentColor" />
  </svg>
</template>

<style scoped>
.pixel-word {
  display: block;
  flex: none;
}
</style>
