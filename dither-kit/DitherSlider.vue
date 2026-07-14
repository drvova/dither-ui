<script lang="ts">
import { rgb, type Rgb } from "./palette"
import { BAYER4, clamp01, fillOf, type PixelColor } from "./pixel"

/** Paint the slider track — the filled portion dithers toward the thumb with
 * rising density, the rest reads as a muted rail. */
function paintTrack(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  fill: Rgb,
  muted: Rgb,
  ratio: number
): void {
  ctx.clearRect(0, 0, cols, rows)
  const filled = Math.round(cols * clamp01(ratio))
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (x < filled) {
        const density = 0.35 + 0.65 * ((x + 0.5) / Math.max(1, filled))
        const lit = density > BAYER4[y & 3][x & 3]
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

const CELL = 2

const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    color?: PixelColor
    disabled?: boolean
    class?: string
  }>(),
  { min: 0, max: 100, step: 1, color: "blue", disabled: false }
)

const emit = defineEmits<{ (e: "update:modelValue", value: number): void }>()

const rootRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const ratio = computed(() =>
  clamp01((props.modelValue - props.min) / Math.max(1e-9, props.max - props.min))
)

function paint() {
  const root = rootRef.value
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d")
  if (!root || !canvas || !ctx) return
  const box = root.getBoundingClientRect()
  const cols = Math.max(4, Math.round(box.width / CELL))
  const rows = 3 // h-1.5 track at CELL=2
  canvas.width = cols
  canvas.height = rows
  paintTrack(ctx, cols, rows, fillOf(props.color), fillOf("grey"), ratio.value)
}

function clampStep(raw: number): number {
  const stepped =
    props.min + Math.round((raw - props.min) / props.step) * props.step
  return Math.min(props.max, Math.max(props.min, stepped))
}

function valueFromClientX(clientX: number): number {
  const rect = rootRef.value!.getBoundingClientRect()
  const t = clamp01((clientX - rect.left) / Math.max(1, rect.width))
  return clampStep(props.min + t * (props.max - props.min))
}

function onPointerDown(event: PointerEvent) {
  if (props.disabled) return
  rootRef.value?.setPointerCapture(event.pointerId)
  emit("update:modelValue", valueFromClientX(event.clientX))
}

function onPointerMove(event: PointerEvent) {
  if (props.disabled || !rootRef.value?.hasPointerCapture(event.pointerId)) return
  emit("update:modelValue", valueFromClientX(event.clientX))
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return
  let next: number
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = props.modelValue - props.step
  else if (event.key === "ArrowRight" || event.key === "ArrowUp") next = props.modelValue + props.step
  else if (event.key === "Home") next = props.min
  else if (event.key === "End") next = props.max
  else return
  event.preventDefault()
  emit("update:modelValue", clampStep(next))
}

let ro: ResizeObserver | null = null
onMounted(() => {
  paint()
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(paint)
    if (rootRef.value) ro.observe(rootRef.value)
  }
})
watch(() => [props.modelValue, props.color, props.min, props.max], paint)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div
    ref="rootRef"
    :class="
      cn(
        'relative h-4 w-full touch-none select-none',
        props.disabled ? 'pointer-events-none opacity-40' : 'cursor-pointer',
        props.class
      )
    "
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
  >
    <div class="absolute top-1/2 h-1.5 w-full -translate-y-1/2 overflow-hidden rounded-[2px]">
      <canvas
        ref="canvasRef"
        aria-hidden="true"
        class="absolute inset-0 h-full w-full"
        style="image-rendering: pixelated"
      />
    </div>
    <div
      role="slider"
      :tabindex="props.disabled ? -1 : 0"
      :aria-valuemin="props.min"
      :aria-valuemax="props.max"
      :aria-valuenow="props.modelValue"
      :aria-disabled="props.disabled || undefined"
      class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-foreground"
      :style="{ left: `${ratio * 100}%` }"
      @keydown="onKeydown"
    />
  </div>
</template>
