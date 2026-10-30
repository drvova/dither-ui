<script lang="ts">
import { type Rgb } from "../engine/palette"
import { cellCanvas } from "../engine/raster"
import { BAYER4, clamp01, fillOf, type PixelColor } from "../engine/pixel"

// Chunky pixel checkmark on the 8x8 cell grid (size-4 box at CELL=2).
/** The checkmark's near-white ink. */
const MARK_INK: Rgb = [245, 245, 248]
const MARK: Array<[number, number]> = [
  [1, 3],
  [1, 4],
  [2, 4],
  [2, 5],
  [3, 5],
  [3, 6],
  [4, 4],
  [4, 5],
  [5, 3],
  [5, 4],
  [6, 2],
  [6, 3],
]

/** Paint the checkbox — a 1px border when unchecked, a dithered fill with a
 * near-white pixel checkmark when checked. */
function paintBox(
  ctx: CanvasRenderingContext2D,
  n: number,
  fill: Rgb,
  muted: Rgb,
  checked: boolean,
  matrix: number[][] = BAYER4,
): void {
  const px = cellCanvas(ctx, n, n)
  if (!checked) {
    px.rect(0, 0, n, 1, muted, 0.6)
    px.rect(0, n - 1, n, 1, muted, 0.6)
    px.rect(0, 0, 1, n, muted, 0.6)
    px.rect(n - 1, 0, 1, n, muted, 0.6)
    px.flush()
    return
  }
  const density = 0.8
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const lit = density > matrix[y & 3][x & 3]
      const k = 0.3 + density * 0.7
      px.cell(x, y, fill, clamp01(lit ? k : k * 0.4))
    }
  }
  for (const [x, y] of MARK) px.cell(x, y, MARK_INK, 0.95)
  px.flush()
}
</script>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { cn } from "./lib"
import { kitFromSeed } from "../engine/dither-paint"
import { CONTROL_BUTTON } from "./control"
import { useDitherMatrix } from "../engine/use-screen"

const CELL = 2

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    color?: PixelColor
    seed?: number
    disabled?: boolean
    class?: string
  }>(),
  { disabled: false },
)
const s = computed(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
const color = computed<PixelColor>(() => props.color ?? s.value?.hue ?? "blue")
const matrix = useDitherMatrix(() => props.seed)

const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>()

const boxRef = ref<HTMLSpanElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

function paint() {
  const box = boxRef.value
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d", { willReadFrequently: true })
  if (!box || !canvas || !ctx) return
  const n = Math.max(4, Math.round(box.getBoundingClientRect().width / CELL))
  canvas.width = n
  canvas.height = n
  paintBox(ctx, n, fillOf(color.value), fillOf("grey"), props.modelValue, matrix.value)
}

onMounted(() => requestAnimationFrame(paint))
watch(() => [props.modelValue, color.value, matrix.value], paint)
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="props.modelValue"
    :disabled="props.disabled"
    :class="cn(CONTROL_BUTTON, 'relative inline-flex min-h-10 items-center gap-2 text-left', props.class)"
    @click="emit('update:modelValue', !props.modelValue)"
  >
    <span ref="boxRef" class="relative size-4 shrink-0">
      <canvas
        ref="canvasRef"
        aria-hidden="true"
        class="absolute inset-0 h-full w-full"
        style="image-rendering: pixelated"
      />
    </span>
    <span class="text-[13px] text-foreground"><slot /></span>
  </button>
</template>
