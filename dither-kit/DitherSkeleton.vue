<script lang="ts">
import { rgb } from "./palette"
import { BAYER4, fillOf, pixelPrefersReducedMotion } from "./pixel"

const CELL = 2
const GREY = fillOf("grey")

/** One frame of the muted field — density breathes ±0.1 around 0.45 so pixels
 * flip on and off through their Bayer thresholds as the sine sweeps. */
function paintSkeleton(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  phase: number
): void {
  ctx.clearRect(0, 0, cols, rows)
  const density = 0.45 + 0.1 * Math.sin(phase)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const lit = density > BAYER4[y & 3][x & 3]
      ctx.fillStyle = rgb(GREY, 0.8, lit ? 0.5 : 0.18)
      ctx.fillRect(x, y, 1, 1)
    }
  }
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"

const props = defineProps<{ class?: string }>()

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let teardown: (() => void) | undefined

function init(): (() => void) | undefined {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d")
  if (!wrap || !canvas || !ctx) return undefined
  const reduce = pixelPrefersReducedMotion()

  let cols = 0
  let rows = 0
  let phase = 0
  let raf = 0

  const draw = () => paintSkeleton(ctx, cols, rows, phase)

  const resize = () => {
    const box = wrap.getBoundingClientRect()
    cols = Math.max(4, Math.round(box.width / CELL))
    rows = Math.max(2, Math.round(box.height / CELL))
    canvas.width = cols
    canvas.height = rows
    draw()
  }
  resize()

  const tick = (now: number) => {
    phase = now * 0.0015
    draw()
    raf = requestAnimationFrame(tick)
  }
  if (!reduce) raf = requestAnimationFrame(tick)

  const ro =
    typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null
  ro?.observe(wrap)

  return () => {
    if (raf) cancelAnimationFrame(raf)
    ro?.disconnect()
  }
}

onMounted(() => {
  teardown = init()
})
onBeforeUnmount(() => teardown?.())
</script>

<template>
  <div
    ref="wrapRef"
    aria-hidden="true"
    :class="cn('relative overflow-hidden', props.class)"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 h-full w-full"
      style="image-rendering: pixelated"
    />
  </div>
</template>
