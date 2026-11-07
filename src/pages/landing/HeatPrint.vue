<script setup lang="ts">
// A sheet of the heat (`heat.ts`) on the kit's background runtime, where
// its `field` lets it print: the close's band, a plate. Painted at a film's
// cadence while the page drives it (`paused` false), held otherwise, one
// still frame under reduced motion; it follows the hand over its box. It
// prints through the screen around it (`DitherScreen`).
import { onBeforeUnmount, onMounted, ref } from "vue"
import { fillOf } from "@dither-kit/engine/pixel"
import { useDitherBackground } from "@dither-kit/engine/use-dither-background"
import { useDitherMatrix } from "@dither-kit/engine/use-screen"
import { CLOSE, closeField, paintHeat, type HeatField } from "./heat"
import { RAMP as INKS } from "./plate"

// A function-typed prop's default is the value itself, never a factory.
const props = withDefaults(defineProps<{ paused: boolean; field?: HeatField; seed?: number }>(), {
  field: closeField,
  seed: 9,
})

const RAMP = INKS.map(fillOf)
const matrix = useDitherMatrix(() => props.seed)
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
  restart: () => [props.field, props.seed],
  frameRate: () => CLOSE.fps,
  render: (buffer, clock) => paintHeat(buffer, clock, hand, CLOSE.cell, RAMP, matrix.value, props.field),
})
</script>

<template>
  <div ref="wrapRef" aria-hidden="true" class="heat-print">
    <canvas ref="canvasRef" :style="{ imageRendering: 'pixelated' }" />
  </div>
</template>

<style scoped>
.heat-print {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

.heat-print canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
