<script lang="ts">
import { rgb, type Rgb } from "./palette"
import { BAYER4, clamp01, fillOf } from "./pixel"

/** Paint the meter track — DitherProgress's determinate recipe, no motion. */
function paintMeter(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  fill: Rgb,
  muted: Rgb,
  ratio: number,
  matrix: number[][] = BAYER4
): void {
  ctx.clearRect(0, 0, cols, rows)
  const filled = Math.round(cols * clamp01(ratio))
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (x < filled) {
        const density = 0.35 + 0.65 * ((x + 0.5) / Math.max(1, filled))
        const lit = density > matrix[y & 3][x & 3]
        const k = 0.3 + density * 0.7
        ctx.fillStyle = rgb(fill, 1, clamp01(lit ? k : k * 0.4))
      } else {
        const lit = 0.25 > matrix[y & 3][x & 3]
        ctx.fillStyle = rgb(muted, 1, lit ? 0.2 : 0.06)
      }
      ctx.fillRect(x, y, 1, 1)
    }
  }
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"
import type { DitherColor } from "./palette"

const CELL = 2

const props = withDefaults(
  defineProps<{
    value: number
    min?: number
    max?: number
    low?: number
    high?: number
    class?: string
  }>(),
  { min: 0, max: 100, low: 0.5, high: 0.8 }
)

const ratio = computed(() =>
  clamp01((props.value - props.min) / (props.max - props.min || 1))
)
const zone = computed<DitherColor>(() =>
  ratio.value < props.low ? "green" : ratio.value > props.high ? "red" : "orange"
)

const rootRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let cols = 0
const rows = 3 // h-1.5 track at CELL=2

function paint() {
  const ctx = canvasRef.value?.getContext("2d")
  if (!ctx || cols <= 0) return
  paintMeter(ctx, cols, rows, fillOf(zone.value), fillOf("grey"), ratio.value)
}

function resize() {
  const root = rootRef.value
  const canvas = canvasRef.value
  if (!root || !canvas) return
  cols = Math.max(4, Math.round(root.getBoundingClientRect().width / CELL))
  canvas.width = cols
  canvas.height = rows
  paint()
}

let ro: ResizeObserver | null = null
onMounted(() => {
  resize()
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(resize)
    if (rootRef.value) ro.observe(rootRef.value)
  }
})
watch(() => [props.value, props.min, props.max, props.low, props.high], paint)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div
    ref="rootRef"
    role="meter"
    :aria-valuemin="props.min"
    :aria-valuemax="props.max"
    :aria-valuenow="props.value"
    :class="cn('relative h-1.5 w-full overflow-hidden rounded-[2px]', props.class)"
  >
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      class="absolute inset-0 h-full w-full"
      style="image-rendering: pixelated"
    />
  </div>
</template>
