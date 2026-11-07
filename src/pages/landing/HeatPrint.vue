<script setup lang="ts">
// The close's heat (`close.ts`) on the kit's background runtime: painted at
// a film's cadence while the page drives it, held still otherwise, one
// still frame under reduced motion. It follows the hand over the band.
import { onBeforeUnmount, onMounted, ref } from "vue"
import { fillOf } from "@dither-kit/engine/pixel"
import { useDitherBackground } from "@dither-kit/engine/use-dither-background"
import { useDitherMatrix } from "@dither-kit/engine/use-screen"
import { CLOSE, paintHeat } from "./close"
import { RAMP as INKS } from "./plate"

const props = defineProps<{ paused: boolean }>()

const RAMP = INKS.map(fillOf)
const matrix = useDitherMatrix(() => 9)
const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let hand: [number, number] | null = null
function point(e: PointerEvent) {
  const box = wrapRef.value?.getBoundingClientRect()
  if (!box) return
  const x = e.clientX - box.left
  const y = e.clientY - box.top
  hand = x >= 0 && y >= 0 && x <= box.width && y <= box.height ? [x, y] : null
}
onMounted(() => addEventListener("pointermove", point, { passive: true }))
onBeforeUnmount(() => removeEventListener("pointermove", point))

useDitherBackground({
  wrapRef,
  canvasRef,
  cell: CLOSE.cell,
  maxCols: 1200,
  maxRows: 900,
  dpr: () => 1,
  paused: () => props.paused,
  renderMode: () => "live",
  precompiled: () => undefined,
  restart: () => [],
  frameRate: () => CLOSE.fps,
  render: (buffer, clock) => paintHeat(buffer, clock, hand, CLOSE.cell, RAMP, matrix.value),
})
</script>

<template>
  <div ref="wrapRef" aria-hidden="true" class="close-heat">
    <canvas ref="canvasRef" :style="{ imageRendering: 'pixelated' }" />
  </div>
</template>

<style scoped>
.close-heat {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

.close-heat canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
