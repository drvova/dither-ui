<script lang="ts">
import { BAYER4, pixelMatrixFromSeed } from "./pixel"

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
  focusY: number,
  fade: number,
  matrix: number[][]
): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
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
  const f = Math.max(1, Math.round(fade / cell)) // fade margin in cells
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const t = matrix[y & 3][x & 3]
      // Dithered dissolve: toward every edge pixels first darken, then drop
      // out through the same Bayer matrix — the image melts into the page.
      let e = 1
      if (fade > 0) {
        e = Math.min(Math.min(x, cols - 1 - x, y, rows - 1 - y) / f, 1)
        if (e < 1 && e * e <= t) {
          d[i + 3] = 0
          continue
        }
      }
      const luma = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255
      const k = (luma > t ? 1 : 0.45) * (0.25 + 0.75 * e)
      d[i] = Math.round(d[i] * k)
      d[i + 1] = Math.round(d[i + 1] * k)
      d[i + 2] = Math.round(d[i + 2] * k)
    }
  }
  ctx.putImageData(px, 0, 0)
}
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"
import { kitFromSeed } from "./dither-paint"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "./precompile"

const props = withDefaults(
  defineProps<{
    src: string
    alt?: string
    /** css px per dither cell — bigger means chunkier. */
    cell?: number
    /** vertical crop focus for cover-fit: 0 top, 0.5 center, 1 bottom. */
    focusY?: number
    /** css px of dithered edge dissolve — 0 keeps hard edges. */
    fade?: number
    seed?: number
    class?: string
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
  }>(),
  { alt: "", renderMode: "live", precompiled: undefined }
)

const s = computed(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
const effCell = computed(() => props.cell ?? s.value?.cell ?? 3)
const effFocusY = computed(() => props.focusY ?? s.value?.focusY ?? 0.5)
const effFade = computed(() => props.fade ?? s.value?.fade ?? 0)
const matrix = computed(() => props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4)
const precompiled = computed(() => precompiledSrc(props.precompiled))

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const img = new Image()
img.crossOrigin = "anonymous"

let ro: ResizeObserver | null = null
let restartToken = 0
function paint() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  if (!wrap || !canvas) return
  const box = wrap.getBoundingClientRect()
  paintImage(canvas, img, box.width, box.height, effCell.value, effFocusY.value, effFade.value, matrix.value)
}

function load() {
  if (precompiled.value) return
  img.onload = paint
  if (img.src !== props.src) img.src = props.src
  else if (img.complete) paint()
}

function stopRuntime() {
  ro?.disconnect()
  ro = null
  img.onload = null
}

function startRuntime() {
  const token = ++restartToken
  stopRuntime()
  if (precompiled.value) return
  void nextTick(() => {
    if (token !== restartToken || precompiled.value) return
    load()
    if (props.renderMode !== "static" && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(paint)
      if (wrapRef.value) ro.observe(wrapRef.value)
    }
  })
}

onMounted(startRuntime)
watch(() => [props.src, precompiled.value, props.renderMode], startRuntime, { flush: "post" })
watch([effCell, effFocusY, effFade, matrix], paint, { flush: "post" })
onBeforeUnmount(() => {
  restartToken += 1
  stopRuntime()
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
    <img
      v-if="precompiled"
      :src="precompiled"
      :alt="props.alt"
      class="absolute inset-0 h-full w-full object-cover"
      style="image-rendering: pixelated"
    />
    <canvas
      v-else
      ref="canvasRef"
      class="absolute inset-0 h-full w-full"
      style="image-rendering: pixelated"
    />
  </div>
</template>
