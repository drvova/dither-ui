<script setup lang="ts">
import { computed } from "vue"
import { FIGURE_N, figureCells, STAGE_CAPTIONS, stageFills } from "./essay-figure"

// The essay's sticky figure. Markup, not canvas: 576 rects built once at
// setup; the active statement picks the stage, and every rect's fill
// transitions to the new scene with a delay keyed to its Bayer rank — the
// scene change is itself an ordered-dither wipe (see essay-figure.ts).
// Decoration: aria-hidden; the caption is the statement's index in words.
const props = defineProps<{ stage: number }>()

const CELLS = figureCells()
const fills = computed(() => stageFills(Math.max(0, props.stage)))
const caption = computed(() => STAGE_CAPTIONS[Math.max(0, props.stage) % STAGE_CAPTIONS.length])
const index = computed(() => String((Math.max(0, props.stage) % STAGE_CAPTIONS.length) + 1).padStart(2, "0"))
</script>

<template>
  <figure class="fig" aria-hidden="true">
    <svg :viewBox="`0 0 ${FIGURE_N} ${FIGURE_N}`" shape-rendering="crispEdges" class="lattice">
      <rect
        v-for="(c, i) in CELLS"
        :key="i"
        :x="c.x"
        :y="c.y"
        width="1"
        height="1"
        class="cell"
        :style="{ fill: fills[i], '--r': c.rank }"
      />
    </svg>
    <figcaption class="micro cap"><span class="n">{{ index }}</span> · {{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.fig {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.lattice {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  background: #05060a;
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-border) 90%, transparent);
  padding: 1.5px;
  box-sizing: border-box;
}

/* Cells have a hairline gap (the lattice reads as pixels, not a bitmap):
   width/height 1 with a 3% inset stroke of the void. The morph: fill
   transitions on the house settle, delayed by the cell's Bayer rank so the
   16 ranks sweep across ~350ms. */
.cell {
  stroke: #05060a;
  stroke-width: 0.08;
  transition: fill 420ms cubic-bezier(0.2, 0, 0, 1);
  transition-delay: calc(var(--r, 0) * 22ms);
}

.cap {
  color: color-mix(in oklab, var(--color-muted-foreground) 85%, transparent);
}

.n {
  color: var(--swatch-orange);
}

@media (prefers-reduced-motion: reduce) {
  .cell {
    transition: none;
  }
}
</style>
