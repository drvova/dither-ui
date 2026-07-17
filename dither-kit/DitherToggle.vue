<script lang="ts">
import { type Rgb } from "./palette"
import { BAYER4, clamp01 } from "./pixel"
import { createRasterBuffer, putRasterBuffer } from "./raster"

const CELL = 2

/** DitherBadge's rest gradient fill behind the pressed label — sized from the
 * host button and edged with the 1px brighter lines. Shared with
 * DitherToggleGroup. Uses RasterBuffer for bulk pixel writes instead of
 * per-pixel fillRect (10-20x faster for typical toggle sizes). */
export function paintToggleCanvas(
  host: HTMLElement,
  canvas: HTMLCanvasElement,
  fill: Rgb,
  matrix: number[][] = BAYER4
): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return
  const box = host.getBoundingClientRect()
  const cols = Math.max(4, Math.round(box.width / CELL))
  const rows = Math.max(4, Math.round(box.height / CELL))
  canvas.width = cols
  canvas.height = rows
  const buf = createRasterBuffer(cols, rows)
  const { data } = buf
  const [r, g, b] = fill
  for (let y = 0; y < rows; y++) {
    const density = 0.25 + 0.75 * ((y + 0.5) / rows)
    for (let x = 0; x < cols; x++) {
      const lit = density > matrix[y & 3][x & 3]
      const k = 0.3 + density * 0.7
      const a = clamp01(lit ? k : k * 0.4)
      const idx = (y * cols + x) * 4
      data[idx] = (r * a + 0.5) | 0
      data[idx + 1] = (g * a + 0.5) | 0
      data[idx + 2] = (b * a + 0.5) | 0
      data[idx + 3] = 255
    }
  }
  // Edge lines (top/bottom/left/right) at 50% opacity
  const edgeA = 0.5
  const er = (r * edgeA + 0.5) | 0
  const eg = (g * edgeA + 0.5) | 0
  const eb = (b * edgeA + 0.5) | 0
  for (let x = 0; x < cols; x++) {
    let idx = x * 4
    data[idx] = er; data[idx + 1] = eg; data[idx + 2] = eb; data[idx + 3] = 255
    idx = ((rows - 1) * cols + x) * 4
    data[idx] = er; data[idx + 1] = eg; data[idx + 2] = eb; data[idx + 3] = 255
  }
  for (let y = 0; y < rows; y++) {
    let idx = y * cols * 4
    data[idx] = er; data[idx + 1] = eg; data[idx + 2] = eb; data[idx + 3] = 255
    idx = (y * cols + cols - 1) * 4
    data[idx] = er; data[idx + 1] = eg; data[idx + 2] = eb; data[idx + 3] = 255
  }
  putRasterBuffer(ctx, buf)
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"
import { fillOf, type PixelColor, pixelMatrixFromSeed } from "./pixel"
import { kitFromSeed } from "./dither-paint"

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    color?: PixelColor
    seed?: number
    disabled?: boolean
    class?: string
  }>(),
  { disabled: false }
)
const s = computed(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
const color = computed<PixelColor>(() => props.color ?? s.value?.hue ?? "blue")
const matrix = computed(() => props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4)

const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>()

const buttonRef = ref<HTMLButtonElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let ro: ResizeObserver | null = null

function paint() {
  if (!props.modelValue) return
  if (buttonRef.value && canvasRef.value)
    paintToggleCanvas(buttonRef.value, canvasRef.value, fillOf(color.value), matrix.value)
}

let paintRaf = 0
function deferredPaint() {
  if (paintRaf) return
  paintRaf = requestAnimationFrame(() => {
    paintRaf = 0
    paint()
  })
}

onMounted(() => {
  if (typeof ResizeObserver !== "undefined" && buttonRef.value) {
    ro = new ResizeObserver(deferredPaint)
    ro.observe(buttonRef.value)
  } else {
    deferredPaint()
  }
})
watch(() => [props.modelValue, color.value, matrix.value], deferredPaint)
onBeforeUnmount(() => {
  ro?.disconnect()
  if (paintRaf) cancelAnimationFrame(paintRaf)
})
</script>

<template>
  <button
    ref="buttonRef"
    type="button"
    :aria-pressed="props.modelValue"
    :disabled="props.disabled"
    :class="
      cn(
        'relative isolate overflow-hidden rounded-md border px-2.5 py-1.5 font-mono text-[12px] transition-colors focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40',
        props.modelValue
          ? 'border-transparent text-foreground'
          : 'border-border text-muted-foreground hover:text-foreground',
        props.class
      )
    "
    @click="emit('update:modelValue', !props.modelValue)"
  >
    <canvas
      v-show="props.modelValue"
      ref="canvasRef"
      aria-hidden="true"
      class="absolute inset-0 -z-10 h-full w-full"
      style="image-rendering: pixelated"
    />
    <span class="relative"><slot /></span>
  </button>
</template>
