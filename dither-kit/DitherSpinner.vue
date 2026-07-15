<script lang="ts">
import { rgb } from "./palette"
import type { Rgb } from "./palette"
import {
  BAYER4,
  fillOf,
  type PixelColor,
  pixelMatrixFromSeed,
  pixelPrefersReducedMotion,
  xorshift32,
} from "./pixel"

const CELL = 2
const TAU = Math.PI * 2

/** A spinner is a point in a continuous form space, not a preset. A rotating
 * brightness wave sweeps a ring; `segments` carves it into dots/bars, `spokes`
 * adds radial petals, `innerRatio`/`taper`/`arc` shape the band and falloff.
 * So one seed yields an arc, a ring of dots, a rotating flower, a thin comet
 * — and everything between. Ranges bounded so no seed is unreadable. */
export type SpinnerParams = {
  speed: number
  dir: 1 | -1
  arc: number // fraction of the ring the wave spans (0..1)
  segments: number // 0 = continuous; N = N dots/bars
  spokes: number // 0 = none; N = radial petals
  innerRatio: number // hollow center as a fraction of outer radius
  taper: number // brightness falloff along the wave
}
const SPINNER_DEFAULT: SpinnerParams = {
  speed: 0.004,
  dir: 1,
  arc: 0.75,
  segments: 0,
  spokes: 0,
  innerRatio: 0.5,
  taper: 0.8,
}

function spinnerFromSeed(seed: number): SpinnerParams {
  const rand = xorshift32(Math.round(seed) ^ 0x2f72b4a1)
  return {
    speed: 0.0025 + rand() * 0.006,
    dir: rand() < 0.5 ? 1 : -1,
    arc: 0.35 + rand() * 0.75,
    segments: Math.floor(rand() ** 1.4 * 13), // usually few, sometimes many
    spokes: Math.floor(rand() ** 2 * 7), // petals are rarer
    innerRatio: 0.3 + rand() * 0.45,
    taper: 0.3 + rand() * 0.7,
  }
}

/** One frame — render the ring, sampling a rotating brightness wave against the
 * dither matrix. `start` is the head angle (advances over time). */
function paintSpinner(
  ctx: CanvasRenderingContext2D,
  cells: number,
  fill: Rgb,
  start: number,
  matrix: number[][] = BAYER4,
  p: SpinnerParams = SPINNER_DEFAULT
): void {
  ctx.clearRect(0, 0, cells, cells)
  const c = cells / 2
  const rOuter = c - 0.5
  const rInner = Math.max(1, rOuter * p.innerRatio)
  const arcW = Math.max(0.05, Math.min(1, p.arc)) * TAU
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const dx = x + 0.5 - c
      const dy = y + 0.5 - c
      const r = Math.hypot(dx, dy)
      if (r < rInner || r > rOuter) continue
      const ang = (Math.atan2(dy, dx) + TAU) % TAU
      // Brightness wave, relative to the rotating head.
      const rel = ((ang - start * p.dir) % TAU + TAU) % TAU
      let bright = rel <= arcW ? 1 - p.taper * (rel / arcW) : 0
      // Segmentation: fixed gaps in space that the wave sweeps through.
      if (p.segments > 0) {
        const phase = ((ang / TAU) * p.segments) % 1
        if (phase > 0.6) bright = 0 // 40% gap between dots
      }
      // Spokes: radial petals modulate by absolute angle.
      if (p.spokes > 0) bright *= 0.35 + 0.65 * Math.abs(Math.cos((ang * p.spokes) / 2)) ** 2
      if (bright <= 0 || bright <= matrix[y & 3][x & 3]) continue
      ctx.fillStyle = rgb(fill, 1, 0.4 + 0.6 * bright)
      ctx.fillRect(x, y, 1, 1)
    }
  }
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue"

const props = withDefaults(
  defineProps<{
    size?: number
    color?: PixelColor
    seed?: number
  }>(),
  { size: 20, color: "blue" }
)

const spin = props.seed !== undefined ? spinnerFromSeed(props.seed) : SPINNER_DEFAULT
const matrix = props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4

const canvasRef = ref<HTMLCanvasElement | null>(null)

let teardown: (() => void) | undefined

function init(): (() => void) | undefined {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d")
  if (!canvas || !ctx) return undefined
  const fill = fillOf(props.color)
  const cells = Math.max(8, Math.round(props.size / CELL))
  canvas.width = cells
  canvas.height = cells

  let raf = 0
  let last = 0

  paintSpinner(ctx, cells, fill, -Math.PI / 2, matrix, spin)

  if (!pixelPrefersReducedMotion()) {
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (now - last < 33) return // ~30fps
      last = now
      paintSpinner(ctx, cells, fill, (now * spin.speed) % TAU, matrix, spin)
    }
    raf = requestAnimationFrame(frame)
  }

  return () => {
    if (raf) cancelAnimationFrame(raf)
  }
}

onMounted(() => {
  teardown = init()
})
watch(
  () => [props.size, props.color],
  () => {
    teardown?.()
    teardown = init()
  }
)
onBeforeUnmount(() => teardown?.())
</script>

<template>
  <span role="status" aria-label="Loading" class="inline-flex">
    <canvas
      ref="canvasRef"
      :style="{
        width: `${props.size}px`,
        height: `${props.size}px`,
        imageRendering: 'pixelated',
      }"
    />
  </span>
</template>
