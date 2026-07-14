<script lang="ts">
import { rgb, type Rgb } from "./palette"
import { BAYER4, clamp01, fillOf, type PixelColor } from "./pixel"

const BAND_RATIO = 0.4

/** Paint the progress track. `band` null → determinate fill up to `ratio`;
 * otherwise a 40%-wide dithered band starting at cell `band` (wrapping),
 * with the Bayer sampling shifted so the texture itself scrolls. */
function paintProgress(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  fill: Rgb,
  muted: Rgb,
  ratio: number,
  band: number | null
): void {
  ctx.clearRect(0, 0, cols, rows)
  const bandW = Math.max(2, Math.round(cols * BAND_RATIO))
  const span = cols + bandW
  const filled = Math.round(cols * clamp01(ratio))
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let density: number | null = null
      let bx = x
      if (band === null) {
        if (x < filled) density = 0.35 + 0.65 * ((x + 0.5) / Math.max(1, filled))
      } else {
        const p = (((x - band) % span) + span) % span
        if (p < bandW) {
          density = 0.35 + 0.65 * ((p + 0.5) / bandW)
          bx = x - band
        }
      }
      if (density !== null) {
        const lit = density > BAYER4[y & 3][((bx % 4) + 4) & 3]
        const k = 0.3 + density * 0.7
        ctx.fillStyle = rgb(fill, 1, clamp01(lit ? k : k * 0.4))
      } else {
        const lit = 0.25 > BAYER4[y & 3][x & 3]
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
import { pixelPrefersReducedMotion } from "./pixel"
import { kitFromSeed } from "./dither-paint"

const CELL = 2

const props = withDefaults(
  defineProps<{
    value?: number
    color?: PixelColor
    seed?: number
    indeterminate?: boolean
    class?: string
  }>(),
  { value: 0, indeterminate: false }
)
const s = computed(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
const color = computed<PixelColor>(() => props.color ?? s.value?.hue ?? "blue")

const rootRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let raf = 0
let cols = 0
const rows = 3 // h-1.5 track at CELL=2

function paint(band: number | null) {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d")
  if (!canvas || !ctx || cols <= 0) return
  paintProgress(
    ctx,
    cols,
    rows,
    fillOf(color.value),
    fillOf("grey"),
    clamp01(props.value / 100),
    band
  )
}

function repaint() {
  if (props.indeterminate && !raf) {
    // Reduced motion: a static 40% band, no animation loop.
    const bandW = Math.max(2, Math.round(cols * 0.4))
    paint(Math.round((cols - bandW) / 2))
  } else if (!props.indeterminate) {
    paint(null)
  }
}

function tick() {
  const bandW = Math.max(2, Math.round(cols * 0.4))
  paint(Math.floor(performance.now() / 50) % (cols + bandW) - bandW)
  raf = requestAnimationFrame(tick)
}

function syncLoop() {
  const animate = props.indeterminate && !pixelPrefersReducedMotion()
  if (animate && !raf) raf = requestAnimationFrame(tick)
  if (!animate && raf) {
    cancelAnimationFrame(raf)
    raf = 0
  }
  repaint()
}

function resize() {
  const root = rootRef.value
  const canvas = canvasRef.value
  if (!root || !canvas) return
  cols = Math.max(4, Math.round(root.getBoundingClientRect().width / CELL))
  canvas.width = cols
  canvas.height = rows
  repaint()
}

let ro: ResizeObserver | null = null
onMounted(() => {
  resize()
  syncLoop()
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(resize)
    if (rootRef.value) ro.observe(rootRef.value)
  }
})
watch(() => [props.value, color.value, props.indeterminate], syncLoop)
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  ro?.disconnect()
})
</script>

<template>
  <div
    ref="rootRef"
    role="progressbar"
    :aria-valuemin="props.indeterminate ? undefined : 0"
    :aria-valuemax="props.indeterminate ? undefined : 100"
    :aria-valuenow="props.indeterminate ? undefined : props.value"
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
