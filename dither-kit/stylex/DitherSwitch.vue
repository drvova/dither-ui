<!-- Generated from ../tailwind/DitherSwitch.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import { type Rgb } from "../engine/palette"
import { cellCanvas } from "../engine/raster"
import { BAYER4, clamp01, fillOf, type PixelColor } from "../engine/pixel"
import * as stylex from "@stylexjs/stylex"

/** Paint the switch track — dithered gradient in the accent when on, a
 * near-invisible muted wash when off. */
function paintTrack(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  fill: Rgb,
  muted: Rgb,
  on: boolean,
  matrix: number[][] = BAYER4,
): void {
  const px = cellCanvas(ctx, cols, rows)
  for (let y = 0; y < rows; y++) {
    const density = on ? 0.25 + 0.75 * ((y + 0.5) / rows) : 0.2
    for (let x = 0; x < cols; x++) {
      const lit = density > matrix[y & 3][x & 3]
      if (on) {
        const k = 0.3 + density * 0.7
        px.cell(x, y, fill, clamp01(lit ? k : k * 0.4))
      } else {
        px.cell(x, y, muted, lit ? 0.18 : 0.06)
      }
    }
  }
  px.flush()
}

const styles = stylex.create({
  button: {
    position: "relative",
    display: "inline-flex",
    width: "2.5rem",
    height: "2.5rem",
    flexShrink: "0",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius)",
  },
  row: {
    position: "relative",
    display: "inline-flex",
    height: "1.25rem",
    width: "2.25rem",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: "3px",
  },
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  frame: {
    position: "relative",
    width: "0.875rem",
    height: "0.875rem",
    borderRadius: "2px",
    backgroundColor: "var(--foreground)",
  },
  translateX19px: { translate: "19px 0" },
  translateX3px: { translate: "3px 0" },
  transitionTransform: {
    transitionProperty: "transform, translate, scale, rotate",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
})
</script>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { cn, type StyleProp } from "./lib"
import { pixelPrefersReducedMotion, pixelMatrixFromSeed } from "../engine/pixel"
import { kitFromSeed } from "../engine/dither-paint"
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
    xstyle?: StyleProp
  }>(),
  { disabled: false },
)
const s = computed(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
const color = computed<PixelColor>(() => props.color ?? s.value?.hue ?? "blue")
const matrix = computed(() => (props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4))

const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>()

const trackRef = ref<HTMLSpanElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const reduce = ref(false)

function paint() {
  const track = trackRef.value
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d", { willReadFrequently: true })
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
  requestAnimationFrame(paint)
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
    :class="cn(CONTROL_BUTTON, styles.button, props.xstyle, props.class)"
    @click="emit('update:modelValue', !props.modelValue)"
  >
    <span ref="trackRef" v-bind="stylex.attrs(styles.row)">
      <canvas
        ref="canvasRef"
        aria-hidden="true"
        v-bind="stylex.attrs(styles.canvas)"
        style="image-rendering: pixelated"
      />
      <span
        :class="
          cn(styles.frame, [
            props.modelValue ? styles.translateX19px : styles.translateX3px,
            reduce ? null : styles.transitionTransform,
          ])
        "
      />
    </span>
  </button>
</template>
