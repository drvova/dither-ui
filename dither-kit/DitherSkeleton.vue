<script lang="ts">
import { rgb } from "./palette"
import { BAYER4, fillOf, pixelMatrixFromSeed, pixelPrefersReducedMotion, xorshift32 } from "./pixel"

const CELL = 2
const GREY = fillOf("grey")

/** Shimmer character — seed varies the breathe rate, amplitude and baseline
 * so each seeded skeleton pulses uniquely; the default stays calm and steady. */
function shimmerFromSeed(seed: number) {
  const rand = xorshift32(Math.round(seed) ^ 0x3c6ef372)
  return { base: 0.4 + rand() * 0.1, amp: 0.06 + rand() * 0.12, rate: 0.001 + rand() * 0.0015 }
}
const SHIMMER_DEFAULT = { base: 0.45, amp: 0.1, rate: 0.0015 }

/** One frame of the muted field — density breathes around a baseline so pixels
 * flip on and off through their Bayer thresholds as the sine sweeps. */
function paintSkeleton(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  phase: number,
  matrix: number[][] = BAYER4,
  shimmer = SHIMMER_DEFAULT
): void {
  ctx.clearRect(0, 0, cols, rows)
  const density = shimmer.base + shimmer.amp * Math.sin(phase)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const lit = density > matrix[y & 3][x & 3]
      ctx.fillStyle = rgb(GREY, 0.8, lit ? 0.5 : 0.18)
      ctx.fillRect(x, y, 1, 1)
    }
  }
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { useCanvasVisibility } from "./use-visibility"

const props = defineProps<{ seed?: number; class?: string }>()
const shimmer = props.seed !== undefined ? shimmerFromSeed(props.seed) : SHIMMER_DEFAULT
const matrix = props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let teardown: (() => void) | undefined
let wake: (() => void) | undefined
// Pause the shimmer loop while off-screen; resume on re-entry.
const isVisible = useCanvasVisibility(canvasRef, () => wake?.())

function init(): (() => void) | undefined {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d", { willReadFrequently: true })
  if (!wrap || !canvas || !ctx) return undefined
  const reduce = pixelPrefersReducedMotion()

  let cols = 0
  let rows = 0
  let phase = 0
  let raf = 0

  const draw = () => paintSkeleton(ctx, cols, rows, phase, matrix, shimmer)

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
    if (!isVisible()) {
      raf = 0
      return // off-screen: pause the loop
    }
    phase = now * shimmer.rate
    draw()
    raf = requestAnimationFrame(tick)
  }
  wake = undefined
  if (!reduce) {
    wake = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  }

  const ro =
    typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null
  ro?.observe(wrap)

  return () => {
    if (raf) cancelAnimationFrame(raf)
    ro?.disconnect()
  }
}

onMounted(() => {
  requestAnimationFrame(() => { teardown = init() })
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
