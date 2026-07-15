<script lang="ts">
import { rgb } from "./palette"
import type { Rgb } from "./palette"
import { BAYER4, fillOf, type PixelColor, pixelMatrixFromSeed, xorshift32 } from "./pixel"

const CELL = 2

type Pt = [number, number]

/** 10 alternating outer/inner vertices of a 5-point star centred in a cell box,
 * `rot` tilts it (seeded for a little per-rating character). */
function starPoly(c: number, rot: number): Pt[] {
  const outer = c - 0.5
  const inner = outer * 0.42
  const pts: Pt[] = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5
    pts.push([c + Math.cos(a) * r, c + Math.sin(a) * r])
  }
  return pts
}

function inPoly(px: number, py: number, poly: Pt[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Paint `max` dithered stars. Each star fills left-to-right up to its fraction
 * of `value` (so 3.5 lights three-and-a-half); the lit body is dense, the empty
 * remainder a faint dithered ghost, the boundary dissolving through the matrix. */
function paintRating(
  ctx: CanvasRenderingContext2D,
  cells: number,
  max: number,
  value: number,
  fill: Rgb,
  matrix: number[][],
  rot: number
): void {
  ctx.clearRect(0, 0, cells * max, cells)
  const poly = starPoly(cells / 2, rot)
  for (let s = 0; s < max; s++) {
    const level = Math.min(Math.max(value - s, 0), 1)
    const ox = s * cells
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        if (!inPoly(x + 0.5, y + 0.5, poly)) continue
        const frac = x / cells
        const on = frac <= level
        const density = on ? 0.92 : 0.16
        if (density <= matrix[y & 3][x & 3]) continue
        ctx.fillStyle = on ? rgb(fill, 1, 1) : rgb(fill, 0.55, 0.5)
        ctx.fillRect(ox + x, y, 1, 1)
      }
    }
  }
}
</script>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    modelValue?: number
    max?: number
    color?: PixelColor
    size?: number
    readonly?: boolean
    label?: string
    seed?: number
  }>(),
  { modelValue: 0, max: 5, color: "orange", size: 22, readonly: false, label: "Rating" }
)
const emit = defineEmits<{ (e: "update:modelValue", v: number): void }>()

const matrix = computed(() => (props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4))
const rot = computed(() =>
  props.seed !== undefined ? (xorshift32(Math.round(props.seed) ^ 0x51ed)() - 0.5) * 0.5 : 0
)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const hover = ref<number | null>(null)
const display = computed(() => hover.value ?? props.modelValue)

function paint() {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d")
  if (!canvas || !ctx) return
  const cells = Math.max(6, Math.round(props.size / CELL))
  canvas.width = cells * props.max
  canvas.height = cells
  paintRating(ctx, cells, props.max, display.value, fillOf(props.color), matrix.value, rot.value)
}

onMounted(paint)
watch([() => props.modelValue, () => props.max, () => props.color, () => props.size, hover, matrix], paint)

function starAt(e: PointerEvent): number {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const f = (e.clientX - rect.left) / rect.width
  return Math.min(Math.max(Math.ceil(f * props.max), 1), props.max)
}
const onMove = (e: PointerEvent) => {
  if (!props.readonly) hover.value = starAt(e)
}
const onLeave = () => (hover.value = null)
const commit = (e: PointerEvent) => {
  if (props.readonly) return
  const v = starAt(e)
  emit("update:modelValue", props.modelValue === v ? v - 1 : v) // click same star to clear one
}
function onKey(e: KeyboardEvent) {
  if (props.readonly) return
  let v = props.modelValue
  if (e.key === "ArrowRight" || e.key === "ArrowUp") v = Math.min(v + 1, props.max)
  else if (e.key === "ArrowLeft" || e.key === "ArrowDown") v = Math.max(v - 1, 0)
  else if (e.key === "Home") v = 0
  else if (e.key === "End") v = props.max
  else return
  e.preventDefault()
  if (v !== props.modelValue) emit("update:modelValue", v)
}
</script>

<template>
  <span
    :role="props.readonly ? 'img' : 'slider'"
    :tabindex="props.readonly ? undefined : 0"
    :aria-label="props.label"
    :aria-readonly="props.readonly || undefined"
    :aria-valuemin="props.readonly ? undefined : 0"
    :aria-valuemax="props.readonly ? undefined : props.max"
    :aria-valuenow="props.readonly ? undefined : props.modelValue"
    :aria-valuetext="`${props.modelValue} out of ${props.max}`"
    :class="
      cn(
        'inline-flex rounded-sm outline-none',
        !props.readonly && 'cursor-pointer focus-visible:ring-2 focus-visible:ring-ring'
      )
    "
    @pointermove="onMove"
    @pointerleave="onLeave"
    @pointerdown="commit"
    @keydown="onKey"
  >
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      :style="{ width: `${props.size * props.max}px`, height: `${props.size}px`, imageRendering: 'pixelated' }"
    />
  </span>
</template>
