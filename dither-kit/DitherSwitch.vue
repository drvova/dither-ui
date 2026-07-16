<script lang="ts">
import { rgb, type Rgb } from "./palette"
import { BAYER4, clamp01, fillOf, type PixelColor } from "./pixel"

/** Paint the switch track — dithered gradient in the accent when on, a
 * near-invisible muted wash when off. */
function paintTrack(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  fill: Rgb,
  muted: Rgb,
  on: boolean,
  matrix: number[][] = BAYER4
): void {
  ctx.clearRect(0, 0, cols, rows)
  for (let y = 0; y < rows; y++) {
    const density = on ? 0.25 + 0.75 * ((y + 0.5) / rows) : 0.2
    for (let x = 0; x < cols; x++) {
      const lit = density > matrix[y & 3][x & 3]
      if (on) {
        const k = 0.3 + density * 0.7
        ctx.fillStyle = rgb(fill, 1, clamp01(lit ? k : k * 0.4))
      } else {
        ctx.fillStyle = rgb(muted, 1, lit ? 0.18 : 0.06)
      }
      ctx.fillRect(x, y, 1, 1)
    }
  }
}
</script>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion, pixelMatrixFromSeed } from "./pixel"
import { kitFromSeed } from "./dither-paint"
import { CONTROL_BUTTON } from "./control"

const CELL = 2

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    /** Accessible name — required for screen readers, the control has no text. */
    label?: string
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

const trackRef = ref<HTMLSpanElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const reduce = ref(false)

function paint() {
  const track = trackRef.value
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d")
  if (!track || !canvas || !ctx) return
  const box = track.getBoundingClientRect()
  const cols = Math.max(4, Math.round(box.width / CELL))
  const rows = Math.max(4, Math.round(box.height / CELL))
  canvas.width = cols
  canvas.height = rows
  paintTrack(ctx, cols, rows, fillOf(color.value), fillOf("grey"), props.modelValue, matrix.value)
}

onMounted(() => {
  reduce.value = pixelPrefersReducedMotion()
  paint()
})
watch(() => [props.modelValue, color.value, matrix.value], paint)
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-label="props.label"
    :aria-checked="props.modelValue"
    :disabled="props.disabled"
    :class="cn(CONTROL_BUTTON, 'relative inline-flex size-10 shrink-0 items-center justify-center rounded-md', props.class)"
    @click="emit('update:modelValue', !props.modelValue)"
  >
    <span ref="trackRef" class="relative inline-flex h-5 w-9 items-center overflow-hidden rounded-[3px]">
      <canvas ref="canvasRef" aria-hidden="true" class="absolute inset-0 h-full w-full" style="image-rendering: pixelated" />
      <span
        class="relative size-3.5 rounded-[2px] bg-foreground"
        :class="[props.modelValue ? 'translate-x-[19px]' : 'translate-x-[3px]', reduce ? '' : 'transition-transform duration-150']"
      />
    </span>
  </button>
</template>
