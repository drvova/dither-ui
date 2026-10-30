<script lang="ts">
import { cellCanvas } from "../engine/raster"
import { BAYER4, clamp01, fillOf, type PixelColor } from "../engine/pixel"
import type { Rgb } from "../engine/palette"

export type BadgeVariant = "gradient" | "solid" | "dotted" | "hatched"

const CELL = 2

/** DitherButton's fill at rest intensity — texture capped by the 1px brighter
 * edge lines, no hover machinery. */
function paintBadge(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  fill: Rgb,
  variant: BadgeVariant,
  matrix: number[][] = BAYER4,
): void {
  const px = cellCanvas(ctx, cols, rows)
  const bias = variant === "dotted" ? 0.12 : 0
  for (let y = 0; y < rows; y++) {
    const density = variant === "gradient" ? 0.25 + 0.75 * ((y + 0.5) / rows) : variant === "dotted" ? 0.5 : 0.75
    for (let x = 0; x < cols; x++) {
      if (variant === "hatched" && ((x + y) & 3) >= 2) continue
      const lit = variant === "solid" || density > matrix[y & 3][x & 3] - bias
      if (variant === "dotted" && !lit) continue
      const k = 0.3 + density * 0.7
      px.cell(x, y, fill, clamp01(lit ? k : k * 0.4))
    }
  }
  px.rect(0, 0, cols, 1, fill, 0.5)
  px.rect(0, rows - 1, cols, 1, fill, 0.5)
  px.rect(0, 0, 1, rows, fill, 0.5)
  px.rect(cols - 1, 0, 1, rows, fill, 0.5)
  px.flush()
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"
import { pixelMatrixFromSeed } from "../engine/pixel"
import { kitFromSeed } from "../engine/dither-paint"
import { darkInkOnDark, LABEL_COVERAGE } from "../engine/palette"

const props = withDefaults(
  defineProps<{
    color?: PixelColor
    variant?: BadgeVariant
    seed?: number
    class?: string
  }>(),
  {},
)
const s = computed(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
const matrix = computed(() => (props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4))
const color = computed<PixelColor>(() => props.color ?? s.value?.hue ?? "blue")
const variant = computed<BadgeVariant>(() => props.variant ?? s.value?.variant ?? "gradient")
// A bright fill takes black ink: white on it would sink under AA.
const darkInk = computed(() => darkInkOnDark(fillOf(color.value), LABEL_COVERAGE[variant.value]))

const wrapRef = ref<HTMLSpanElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let ro: ResizeObserver | null = null

function paint() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d", { willReadFrequently: true })
  if (!wrap || !canvas || !ctx) return
  const box = wrap.getBoundingClientRect()
  const cols = Math.max(4, Math.round(box.width / CELL))
  const rows = Math.max(4, Math.round(box.height / CELL))
  canvas.width = cols
  canvas.height = rows
  paintBadge(ctx, cols, rows, fillOf(color.value), variant.value, matrix.value)
}

onMounted(() => {
  requestAnimationFrame(() => {
    paint()
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(paint)
      if (wrapRef.value) ro.observe(wrapRef.value)
    }
  })
})
watch([color, variant, matrix], paint)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <span
    ref="wrapRef"
    :class="
      cn(
        'relative isolate inline-flex items-center overflow-hidden rounded px-2 py-0.5 font-mono text-[10px] text-foreground',
        darkInk && 'text-black',
        props.class,
      )
    "
  >
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      class="absolute inset-0 -z-10 h-full w-full"
      style="image-rendering: pixelated"
    />
    <slot />
  </span>
</template>
