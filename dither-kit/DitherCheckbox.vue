<script lang="ts">
import { rgb, type Rgb } from "./palette"
import { BAYER4, clamp01, fillOf, type PixelColor } from "./pixel"

// Chunky pixel checkmark on the 8x8 cell grid (size-4 box at CELL=2).
const MARK: Array<[number, number]> = [
  [1, 3], [1, 4],
  [2, 4], [2, 5],
  [3, 5], [3, 6],
  [4, 4], [4, 5],
  [5, 3], [5, 4],
  [6, 2], [6, 3],
]

/** Paint the checkbox — a 1px border when unchecked, a dithered fill with a
 * near-white pixel checkmark when checked. */
function paintBox(
  ctx: CanvasRenderingContext2D,
  n: number,
  fill: Rgb,
  muted: Rgb,
  checked: boolean,
  matrix: number[][] = BAYER4
): void {
  ctx.clearRect(0, 0, n, n)
  if (!checked) {
    ctx.fillStyle = rgb(muted, 1, 0.6)
    ctx.fillRect(0, 0, n, 1)
    ctx.fillRect(0, n - 1, n, 1)
    ctx.fillRect(0, 0, 1, n)
    ctx.fillRect(n - 1, 0, 1, n)
    return
  }
  const density = 0.8
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const lit = density > matrix[y & 3][x & 3]
      const k = 0.3 + density * 0.7
      ctx.fillStyle = rgb(fill, 1, clamp01(lit ? k : k * 0.4))
      ctx.fillRect(x, y, 1, 1)
    }
  }
  ctx.fillStyle = "rgba(245,245,248,0.95)"
  for (const [x, y] of MARK) ctx.fillRect(x, y, 1, 1)
}
</script>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { cn } from "./lib"
import { pixelMatrixFromSeed } from "./pixel"
import { kitFromSeed } from "./dither-paint"

const CELL = 2

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

const boxRef = ref<HTMLSpanElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

function paint() {
  const box = boxRef.value
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d")
  if (!box || !canvas || !ctx) return
  const n = Math.max(4, Math.round(box.getBoundingClientRect().width / CELL))
  canvas.width = n
  canvas.height = n
  paintBox(ctx, n, fillOf(color.value), fillOf("grey"), props.modelValue, matrix.value)
}

onMounted(paint)
watch(() => [props.modelValue, color.value, matrix.value], paint)
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="props.modelValue"
    :disabled="props.disabled"
    :class="
      cn(
        'inline-flex items-center gap-2 text-left disabled:pointer-events-none disabled:opacity-40',
        props.class
      )
    "
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
