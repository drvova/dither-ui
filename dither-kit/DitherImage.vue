<script lang="ts">
import { BAYER4 } from "./pixel"

// Backing-resolution caps — same guard rails as DitherGradient.
const MAX_COLS = 960
const MAX_ROWS = 960

/** Ordered-dither an image into chunky cells: each cell keeps its source hue,
 * the Bayer matrix decides whether it renders lit or dimmed — the same
 * texture the buttons and charts use, applied to arbitrary artwork. */
function paintImage(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  width: number,
  height: number,
  cell: number,
  focusY: number
): void {
  const ctx = canvas.getContext("2d")
  if (!ctx || width <= 0 || height <= 0 || !img.naturalWidth) return
  const cols = Math.min(MAX_COLS, Math.max(4, Math.round(width / cell)))
  const rows = Math.min(MAX_ROWS, Math.max(4, Math.round(height / cell)))
  canvas.width = cols
  canvas.height = rows

  // Cover-fit: scale source to fill the cell grid, crop centered.
  const scale = Math.max(cols / img.naturalWidth, rows / img.naturalHeight)
  const sw = cols / scale
  const sh = rows / scale
  const sx = (img.naturalWidth - sw) / 2
  const sy = (img.naturalHeight - sh) * focusY
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows)

  const px = ctx.getImageData(0, 0, cols, rows)
  const d = px.data
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const luma = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255
      const k = luma > BAYER4[y & 3][x & 3] ? 1 : 0.45
      d[i] = Math.round(d[i] * k)
      d[i + 1] = Math.round(d[i + 1] * k)
      d[i + 2] = Math.round(d[i + 2] * k)
    }
  }
  ctx.putImageData(px, 0, 0)
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    src: string
    alt?: string
    /** css px per dither cell — bigger means chunkier. */
    cell?: number
    /** vertical crop focus for cover-fit: 0 top, 0.5 center, 1 bottom. */
    focusY?: number
    class?: string
  }>(),
  { alt: "", cell: 3, focusY: 0.5 }
)

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const img = new Image()
img.crossOrigin = "anonymous"

let ro: ResizeObserver | null = null
function paint() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  if (!wrap || !canvas) return
  const box = wrap.getBoundingClientRect()
  paintImage(canvas, img, box.width, box.height, props.cell, props.focusY)
}

function load() {
  img.onload = paint
  img.src = props.src
}

onMounted(() => {
  load()
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(paint)
    if (wrapRef.value) ro.observe(wrapRef.value)
  }
})
watch(() => props.src, load)
watch(() => [props.cell, props.focusY], paint)
onBeforeUnmount(() => {
  ro?.disconnect()
  img.onload = null
})
</script>

<template>
  <div
    ref="wrapRef"
    :role="props.alt ? 'img' : undefined"
    :aria-label="props.alt || undefined"
    :aria-hidden="props.alt ? undefined : 'true'"
    :class="cn('relative overflow-hidden', props.class)"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 h-full w-full"
      style="image-rendering: pixelated"
    />
  </div>
</template>
