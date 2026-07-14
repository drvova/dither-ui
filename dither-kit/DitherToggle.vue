<script lang="ts">
import { rgb, type Rgb } from "./palette"
import { BAYER4, clamp01 } from "./pixel"

const CELL = 2

/** DitherBadge's rest gradient fill behind the pressed label — sized from the
 * host button and edged with the 1px brighter lines. Shared with
 * DitherToggleGroup. */
export function paintToggleCanvas(
  host: HTMLElement,
  canvas: HTMLCanvasElement,
  fill: Rgb,
  matrix: number[][] = BAYER4
): void {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const box = host.getBoundingClientRect()
  const cols = Math.max(4, Math.round(box.width / CELL))
  const rows = Math.max(4, Math.round(box.height / CELL))
  canvas.width = cols
  canvas.height = rows
  ctx.clearRect(0, 0, cols, rows)
  for (let y = 0; y < rows; y++) {
    const density = 0.25 + 0.75 * ((y + 0.5) / rows)
    for (let x = 0; x < cols; x++) {
      const lit = density > matrix[y & 3][x & 3]
      const k = 0.3 + density * 0.7
      ctx.fillStyle = rgb(fill, 1, clamp01(lit ? k : k * 0.4))
      ctx.fillRect(x, y, 1, 1)
    }
  }
  ctx.fillStyle = rgb(fill, 1, 0.5)
  ctx.fillRect(0, 0, cols, 1)
  ctx.fillRect(0, rows - 1, cols, 1)
  ctx.fillRect(0, 0, 1, rows)
  ctx.fillRect(cols - 1, 0, 1, rows)
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

onMounted(() => {
  paint()
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(paint)
    if (buttonRef.value) ro.observe(buttonRef.value)
  }
})
watch(() => [props.modelValue, color.value, matrix.value], paint)
onBeforeUnmount(() => ro?.disconnect())
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
