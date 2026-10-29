<script setup lang="ts">
// The footer's wordmark, printed as a line screen: "dither-ui" in the
// display face, filled by rows of ink that thicken toward the baseline (a
// vertical ramp through a screen of lines), flat, one ink, nothing that
// glows or moves. One SVG: the text is the clip and the rows are rects, so
// it scales with its box; `textLength` holds the word to the box's width
// whichever face has loaded.
import { useId } from "vue"

const W = 1000
const H = 196
const TOP = 30
const BASE = 182
const ROWS = 24
const PITCH = (BASE - TOP) / ROWS

// Each row's bar sits at the foot of its pitch, from 30% of it at the top
// to 92% at the baseline.
const rows = Array.from({ length: ROWS }, (_, i) => {
  const h = PITCH * (0.3 + (0.62 * i) / (ROWS - 1))
  return { y: TOP + (i + 1) * PITCH - h, h }
})

const clip = useId()
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" class="line-wordmark" aria-hidden="true" focusable="false">
    <defs>
      <clipPath :id="clip">
        <text x="0" :y="BASE" :textLength="W" lengthAdjust="spacingAndGlyphs">dither-ui</text>
      </clipPath>
    </defs>
    <g :clip-path="`url(#${clip})`">
      <rect v-for="(r, i) in rows" :key="i" x="0" :y="r.y" :width="W" :height="r.h" />
    </g>
  </svg>
</template>

<style scoped>
.line-wordmark {
  display: block;
  width: 100%;
  height: auto;
  fill: var(--ink);
}

.line-wordmark text {
  font-family: var(--display-face);
  font-size: 196px;
}
</style>
