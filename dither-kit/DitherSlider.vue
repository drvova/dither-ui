<script lang="ts">
import { rgb, type Rgb } from "./palette"
import { BAYER4, clamp01, fillOf, type PixelColor } from "./pixel"

export type SliderVariant = "gradient" | "dotted" | "hatched" | "solid"

/** Paint the track: the span between lo..hi dithers in the chosen texture,
 * the rest reads as a muted rail; optional tick columns mark divisions. */
function paintTrack(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  fill: Rgb,
  muted: Rgb,
  lo: number,
  hi: number,
  variant: SliderVariant,
  ticks: number[]
): void {
  ctx.clearRect(0, 0, cols, rows)
  const a = Math.round(cols * clamp01(lo))
  const b = Math.round(cols * clamp01(hi))
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (x >= a && x < b) {
        const t = (x - a + 0.5) / Math.max(1, b - a)
        const density =
          variant === "gradient" ? 0.35 + 0.65 * t : variant === "dotted" ? 0.5 : 0.75
        if (variant === "hatched" && ((x + y) & 3) >= 2) {
          ctx.fillStyle = rgb(fill, 1, 0.12)
        } else {
          const lit = variant === "solid" || density > BAYER4[y & 3][x & 3] - (variant === "dotted" ? 0.12 : 0)
          if (variant === "dotted" && !lit) {
            ctx.fillStyle = rgb(fill, 1, 0.1)
          } else {
            const k = 0.3 + density * 0.7
            ctx.fillStyle = rgb(fill, 1, clamp01(lit ? k : k * 0.4))
          }
        }
      } else {
        const lit = 0.25 > BAYER4[y & 3][x & 3]
        ctx.fillStyle = rgb(muted, 1, lit ? 0.2 : 0.06)
      }
      ctx.fillRect(x, y, 1, 1)
    }
  }
  for (const t of ticks) {
    const x = Math.min(cols - 1, Math.round(cols * t))
    const inFill = x >= a && x < b
    ctx.fillStyle = rgb(muted, 2, inFill ? 0.9 : 0.45)
    ctx.fillRect(x, 0, 1, rows)
  }
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"
import { kitFromSeed } from "./dither-paint"

const CELL = 2

const props = withDefaults(
  defineProps<{
    /** A number, or a [lo, hi] pair for a range slider. */
    modelValue: number | [number, number]
    /** Accessible name for the thumb(s). */
    label?: string
    min?: number
    max?: number
    step?: number
    color?: PixelColor
    /** Fill texture — same vocabulary as the charts. */
    variant?: SliderVariant
    /** Paint tick columns at each step (or 10 divisions when steps are dense). */
    ticks?: boolean
    /** Show a value bubble above the thumb while dragging or focused. */
    showValue?: boolean
    disabled?: boolean
    seed?: number
    class?: string
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    ticks: false,
    showValue: false,
    disabled: false,
  }
)
const s = computed(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
const color = computed<PixelColor>(() => props.color ?? s.value?.hue ?? "blue")
const variant = computed<SliderVariant>(() => props.variant ?? s.value?.variant ?? "gradient")

const emit = defineEmits<{ (e: "update:modelValue", value: number | [number, number]): void }>()

const rootRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const isRange = computed(() => Array.isArray(props.modelValue))
const lo = computed(() => (isRange.value ? (props.modelValue as [number, number])[0] : props.min))
const hi = computed(() =>
  isRange.value ? (props.modelValue as [number, number])[1] : (props.modelValue as number)
)
const span = computed(() => Math.max(1e-9, props.max - props.min))
const toRatio = (v: number) => clamp01((v - props.min) / span.value)

/** Which thumb is engaged — drives dragging and the value bubble. */
const active = ref<-1 | 0 | 1>(-1)
const focused = ref<-1 | 0 | 1>(-1)

const tickRatios = computed(() => {
  if (!props.ticks) return []
  const steps = span.value / props.step
  const count = steps <= 25 ? Math.round(steps) : 10
  return Array.from({ length: count + 1 }, (_, i) => i / count)
})

function paint() {
  const root = rootRef.value
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d")
  if (!root || !canvas || !ctx) return
  const box = root.getBoundingClientRect()
  const cols = Math.max(4, Math.round(box.width / CELL))
  const rows = 3
  canvas.width = cols
  canvas.height = rows
  paintTrack(
    ctx,
    cols,
    rows,
    fillOf(color.value),
    fillOf("grey"),
    isRange.value ? toRatio(lo.value) : 0,
    toRatio(hi.value),
    variant.value,
    tickRatios.value
  )
}

function clampStep(raw: number): number {
  const stepped = props.min + Math.round((raw - props.min) / props.step) * props.step
  return Math.min(props.max, Math.max(props.min, stepped))
}

function setThumb(which: 0 | 1, value: number) {
  if (!isRange.value) {
    emit("update:modelValue", clampStep(value))
    return
  }
  const [a, b] = props.modelValue as [number, number]
  const v = clampStep(value)
  // Thumbs may meet but never cross.
  emit("update:modelValue", which === 0 ? [Math.min(v, b), b] : [a, Math.max(v, a)])
}

function valueFromClientX(clientX: number): number {
  const rect = rootRef.value!.getBoundingClientRect()
  const t = clamp01((clientX - rect.left) / Math.max(1, rect.width))
  return props.min + t * span.value
}

function nearestThumb(value: number): 0 | 1 {
  if (!isRange.value) return 1
  return Math.abs(value - lo.value) <= Math.abs(value - hi.value) ? 0 : 1
}

function onPointerDown(event: PointerEvent) {
  if (props.disabled) return
  rootRef.value?.setPointerCapture(event.pointerId)
  const v = valueFromClientX(event.clientX)
  active.value = nearestThumb(v)
  setThumb(active.value, v)
}

function onPointerMove(event: PointerEvent) {
  if (props.disabled || active.value === -1) return
  if (!rootRef.value?.hasPointerCapture(event.pointerId)) return
  setThumb(active.value, valueFromClientX(event.clientX))
}

function onPointerUp() {
  active.value = -1
}

function onKeydown(which: 0 | 1, event: KeyboardEvent) {
  if (props.disabled) return
  const current = which === 0 ? lo.value : hi.value
  let next: number
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = current - props.step
  else if (event.key === "ArrowRight" || event.key === "ArrowUp") next = current + props.step
  else if (event.key === "Home") next = props.min
  else if (event.key === "End") next = props.max
  else return
  event.preventDefault()
  setThumb(which, next)
}

const thumbs = computed(() => {
  const list: { which: 0 | 1; value: number; min: number; max: number; name: string }[] = []
  if (isRange.value) {
    list.push({ which: 0, value: lo.value, min: props.min, max: hi.value, name: props.label ? `${props.label} minimum` : "Minimum" })
    list.push({ which: 1, value: hi.value, min: lo.value, max: props.max, name: props.label ? `${props.label} maximum` : "Maximum" })
  } else {
    list.push({ which: 1, value: hi.value, min: props.min, max: props.max, name: props.label ?? "" })
  }
  return list
})

let ro: ResizeObserver | null = null
onMounted(() => {
  paint()
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(paint)
    if (rootRef.value) ro.observe(rootRef.value)
  }
})
watch(
  () => [props.modelValue, color.value, props.min, props.max, variant.value, props.ticks],
  paint
)
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
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div class="absolute top-1/2 h-1.5 w-full -translate-y-1/2 overflow-hidden rounded-[2px]">
      <canvas
        ref="canvasRef"
        aria-hidden="true"
        class="absolute inset-0 h-full w-full"
        style="image-rendering: pixelated"
      />
    </div>
    <template v-for="t in thumbs" :key="t.which">
      <div
        role="slider"
        :aria-label="t.name || undefined"
        :tabindex="props.disabled ? -1 : 0"
        :aria-valuemin="t.min"
        :aria-valuemax="t.max"
        :aria-valuenow="t.value"
        :aria-disabled="props.disabled || undefined"
        class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-foreground"
        :style="{ left: `${toRatio(t.value) * 100}%` }"
        @keydown="onKeydown(t.which, $event)"
        @focus="focused = t.which"
        @blur="focused = -1"
      />
      <div
        v-if="props.showValue && (active === t.which || focused === t.which)"
        aria-hidden="true"
        class="pointer-events-none absolute -top-6 -translate-x-1/2 rounded border border-border bg-card px-1 py-0.5 font-mono text-[10px] text-foreground tabular-nums"
        :style="{ left: `${toRatio(t.value) * 100}%` }"
      >
        {{ t.value }}
      </div>
    </template>
  </div>
</template>
