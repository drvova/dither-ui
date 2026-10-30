<script lang="ts">
import { cellCanvas } from "../engine/raster"
import { BAYER4, fillOf, pixelMatrixFromSeed, pixelPrefersReducedMotion, xorshift32 } from "../engine/pixel"

const CELL = 2
const GREY = fillOf("grey")

/** Shimmer character — seed varies the breathe rate, amplitude and baseline
 * so each seeded skeleton pulses uniquely; the default stays calm and steady. */
function shimmerFromSeed(seed: number) {
  const rand = xorshift32(Math.round(seed) ^ 0x3c6ef372)
  return { base: 0.4 + rand() * 0.1, amp: 0.06 + rand() * 0.12, rate: 0.001 + rand() * 0.0015 }
}
const SHIMMER_DEFAULT = { base: 0.45, amp: 0.1, rate: 0.0015 }

/** The muted field's density at a phase: it breathes around a baseline so
 * pixels flip on and off through their Bayer thresholds as the sine sweeps. */
const densityAt = (shimmer: typeof SHIMMER_DEFAULT, phase: number) => shimmer.base + shimmer.amp * Math.sin(phase)

/** How many of the matrix's thresholds a density clears: the frame depends
 * on nothing else, so a shimmer has at most 17 distinct frames. */
const levelOf = (thresholds: number[], density: number) => {
  let n = 0
  for (const t of thresholds) if (density > t) n++
  return n
}

/** One frame of the muted field at a density. */
function paintSkeleton(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  density: number,
  matrix: number[][] = BAYER4,
): void {
  const px = cellCanvas(ctx, cols, rows)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const lit = density > matrix[y & 3][x & 3]
      px.cell(x, y, GREY, lit ? 0.5 : 0.18, 0.8)
    }
  }
  px.flush()
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { directedTime, isDirected, onSeek } from "../engine/clock"
import { cn } from "./lib"
import { useCanvasVisibility } from "../engine/use-visibility"

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
  // A frame is painted only when the count of thresholds the density clears
  // changes (at most 17 frames); between crossings the canvas already holds
  // it, so the loop costs a sine and a count.
  const thresholds = matrix.flat()
  let painted = -1

  const draw = () => {
    const density = densityAt(shimmer, phase)
    const level = levelOf(thresholds, density)
    if (level === painted) return
    painted = level
    paintSkeleton(ctx, cols, rows, density, matrix)
  }

  const resize = () => {
    const box = wrap.getBoundingClientRect()
    cols = Math.max(4, Math.round(box.width / CELL))
    rows = Math.max(2, Math.round(box.height / CELL))
    canvas.width = cols
    canvas.height = rows
    painted = -1
    draw()
  }
  resize()

  const tick = (now: number) => {
    if (!isVisible() || isDirected()) {
      raf = 0
      return // off-screen or directed: no loop
    }
    phase = now * shimmer.rate
    draw()
    raf = requestAnimationFrame(tick)
  }
  // Directed (clock.ts): the shimmer phase is the moment's.
  const paintAt = (ms: number) => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    phase = ms * shimmer.rate
    draw()
  }
  wake = undefined
  let unseek: (() => void) | undefined
  if (!reduce) {
    wake = () => {
      if (isDirected()) paintAt(directedTime() ?? 0)
      else if (!raf) raf = requestAnimationFrame(tick)
    }
    unseek = onSeek((ms) => (ms === null ? wake?.() : paintAt(ms)))
    wake()
  }

  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null
  ro?.observe(wrap)

  return () => {
    if (raf) cancelAnimationFrame(raf)
    unseek?.()
    ro?.disconnect()
  }
}

onMounted(() => {
  requestAnimationFrame(() => {
    teardown = init()
  })
})
onBeforeUnmount(() => teardown?.())
</script>

<template>
  <div ref="wrapRef" aria-hidden="true" :class="cn('relative overflow-hidden', props.class)">
    <canvas ref="canvasRef" class="absolute inset-0 h-full w-full" style="image-rendering: pixelated" />
  </div>
</template>
