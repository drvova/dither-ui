<!-- Generated from ../tailwind/DitherSlider.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import { type Rgb } from "../engine/palette"
import { cellCanvas } from "../engine/raster"
import { BAYER4, clamp01, fillOf, type PixelColor } from "../engine/pixel"
import * as stylex from "@stylexjs/stylex"

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
  ticks: number[],
  matrix: number[][] = BAYER4,
): void {
  const px = cellCanvas(ctx, cols, rows)
  const a = Math.round(cols * clamp01(lo))
  const b = Math.round(cols * clamp01(hi))
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (x >= a && x < b) {
        const t = (x - a + 0.5) / Math.max(1, b - a)
        const density = variant === "gradient" ? 0.35 + 0.65 * t : variant === "dotted" ? 0.5 : 0.75
        if (variant === "hatched" && ((x + y) & 3) >= 2) {
          px.cell(x, y, fill, 0.12)
        } else {
          const lit = variant === "solid" || density > matrix[y & 3][x & 3] - (variant === "dotted" ? 0.12 : 0)
          if (variant === "dotted" && !lit) {
            px.cell(x, y, fill, 0.1)
          } else {
            const k = 0.3 + density * 0.7
            px.cell(x, y, fill, clamp01(lit ? k : k * 0.4))
          }
        }
      } else {
        const lit = 0.25 > matrix[y & 3][x & 3]
        px.cell(x, y, muted, lit ? 0.2 : 0.06)
      }
    }
  }
  for (const t of ticks) {
    const x = Math.min(cols - 1, Math.round(cols * t))
    const inFill = x >= a && x < b
    px.rect(x, 0, 1, rows, muted, inFill ? 0.9 : 0.45, 2)
  }
  px.flush()
}

const styles = stylex.create({
  frame: {
    position: "relative",
    marginBlock: "-0.25rem",
    height: "1.5rem",
    width: "100%",
    touchAction: "none",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
  cursorPointer: { cursor: "pointer" },
  layer: {
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    height: "0.375rem",
    width: "100%",
    translate: "0 calc(calc(1 / 2 * 100%) * -1)",
    overflow: "hidden",
    borderRadius: "2px",
  },
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  grid: {
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    display: "grid",
    width: "1.5rem",
    height: "1.5rem",
    translate: "calc(calc(1 / 2 * 100%) * -1) calc(calc(1 / 2 * 100%) * -1)",
    placeItems: "center",
    borderRadius: "4px",
  },
  text: { width: "0.75rem", height: "0.75rem", borderRadius: "2px", backgroundColor: "var(--foreground)" },
  layer2: {
    pointerEvents: "none",
    position: "absolute",
    top: "-1.25rem",
    translate: "calc(calc(1 / 2 * 100%) * -1) 0",
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    paddingInline: "0.25rem",
    paddingBlock: "0.125rem",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--foreground)",
    fontVariantNumeric: "   tabular-nums ",
  },
})
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn, type StyleProp } from "./lib"
import { kitFromSeed } from "../engine/dither-paint"
import { useDitherMatrix } from "../engine/use-screen"

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
    xstyle?: StyleProp
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    ticks: false,
    showValue: false,
    disabled: false,
  },
)
const s = computed(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
const color = computed<PixelColor>(() => props.color ?? s.value?.hue ?? "blue")
const variant = computed<SliderVariant>(() => props.variant ?? s.value?.variant ?? "gradient")
const matrix = useDitherMatrix(() => props.seed)

const emit = defineEmits<{ (e: "update:modelValue", value: number | [number, number]): void }>()

const rootRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const isRange = computed(() => Array.isArray(props.modelValue))
const lo = computed(() => (isRange.value ? (props.modelValue as [number, number])[0] : props.min))
const hi = computed(() => (isRange.value ? (props.modelValue as [number, number])[1] : (props.modelValue as number)))
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
  const ctx = canvas?.getContext("2d", { willReadFrequently: true })
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
    tickRatios.value,
    matrix.value,
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
    list.push({
      which: 0,
      value: lo.value,
      min: props.min,
      max: hi.value,
      name: props.label ? `${props.label} minimum` : "Minimum",
    })
    list.push({
      which: 1,
      value: hi.value,
      min: lo.value,
      max: props.max,
      name: props.label ? `${props.label} maximum` : "Maximum",
    })
  } else {
    list.push({ which: 1, value: hi.value, min: props.min, max: props.max, name: props.label ?? "" })
  }
  return list
})

let ro: ResizeObserver | null = null
onMounted(() => {
  requestAnimationFrame(() => {
    paint()
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(paint)
      if (rootRef.value) ro.observe(rootRef.value)
    }
  })
})
watch(() => [props.modelValue, color.value, props.min, props.max, variant.value, props.ticks, matrix.value], paint)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div
    ref="rootRef"
    :class="
      cn(styles.frame, props.disabled ? styles.pointerEventsNone : styles.cursorPointer, props.xstyle, props.class)
    "
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div v-bind="stylex.attrs(styles.layer)">
      <canvas
        ref="canvasRef"
        aria-hidden="true"
        v-bind="stylex.attrs(styles.canvas)"
        style="image-rendering: pixelated"
      />
    </div>
    <template v-for="t in thumbs" :key="t.which">
      <!-- The thumb is a 24px target around its 12px mark. -->
      <div
        role="slider"
        :aria-label="t.name || undefined"
        :tabindex="props.disabled ? -1 : 0"
        :aria-valuemin="t.min"
        :aria-valuemax="t.max"
        :aria-valuenow="t.value"
        :aria-disabled="props.disabled || undefined"
        v-bind="stylex.attrs(styles.grid)"
        :style="{ left: `${toRatio(t.value) * 100}%` }"
        @keydown="onKeydown(t.which, $event)"
        @focus="focused = t.which"
        @blur="focused = -1"
      >
        <span v-bind="stylex.attrs(styles.text)" />
      </div>
      <div
        v-if="props.showValue && (active === t.which || focused === t.which)"
        aria-hidden="true"
        v-bind="stylex.attrs(styles.layer2)"
        :style="{ left: `${toRatio(t.value) * 100}%` }"
      >
        {{ t.value }}
      </div>
    </template>
  </div>
</template>
