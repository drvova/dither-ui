<!-- Generated from ../tailwind/DitherToggle.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import { type Rgb } from "../engine/palette"
import { BAYER4, clamp01 } from "../engine/pixel"
import { createRasterBuffer, putRasterBuffer } from "../engine/raster"
import * as stylex from "@stylexjs/stylex"

const CELL = 2

/** DitherBadge's rest gradient fill behind the pressed label — sized from the
 * host button and edged with the 1px brighter lines, the hue laid over the
 * page with the density as alpha (a pastel on light, a glow on dark), so
 * the theme's own ink reads on it. Shared with
 * DitherToggleGroup. Uses RasterBuffer for bulk pixel writes instead of
 * per-pixel fillRect (10-20x faster for typical toggle sizes). */
export function paintToggleCanvas(
  host: HTMLElement,
  canvas: HTMLCanvasElement,
  fill: Rgb,
  matrix: number[][] = BAYER4,
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
      data[idx] = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = (a * 255 + 0.5) | 0
    }
  }
  // Edge lines (top/bottom/left/right) at 50% opacity
  const edgeA = 0.5
  const ea = (edgeA * 255 + 0.5) | 0
  for (let x = 0; x < cols; x++) {
    let idx = x * 4
    data[idx] = r
    data[idx + 1] = g
    data[idx + 2] = b
    data[idx + 3] = ea
    idx = ((rows - 1) * cols + x) * 4
    data[idx] = r
    data[idx + 1] = g
    data[idx + 2] = b
    data[idx + 3] = ea
  }
  for (let y = 0; y < rows; y++) {
    let idx = y * cols * 4
    data[idx] = r
    data[idx + 1] = g
    data[idx + 2] = b
    data[idx + 3] = ea
    idx = (y * cols + cols - 1) * 4
    data[idx] = r
    data[idx + 1] = g
    data[idx + 2] = b
    data[idx + 3] = ea
  }
  putRasterBuffer(ctx, buf)
}

const styles = stylex.create({
  button: {
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  borderTransparent: { borderColor: "transparent", color: "#000" },
  borderTransparent2: { borderColor: "transparent", color: "var(--foreground)" },
  borderBorder: {
    borderColor: "var(--border)",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
  canvas: { position: "absolute", inset: "0px", zIndex: "-10", height: "100%", width: "100%" },
  frame: { position: "relative" },
})
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn, type StyleProp } from "./lib"
import { fillOf, type PixelColor } from "../engine/pixel"
import { kitFromSeed } from "../engine/dither-paint"
import { darkInkOnDark, LABEL_COVERAGE } from "../engine/palette"
import { useLabelMatrix } from "../engine/use-screen"

const props = withDefaults(
  defineProps<{
    modelValue: boolean
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
const matrix = useLabelMatrix(() => props.seed)
// A bright fill takes black ink: white on it would sink under AA.
const darkInk = computed(() => darkInkOnDark(fillOf(color.value), LABEL_COVERAGE.gradient))

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
        styles.button,
        props.modelValue ? (darkInk ? styles.borderTransparent : styles.borderTransparent2) : styles.borderBorder,
        props.xstyle,
        props.class,
      )
    "
    @click="emit('update:modelValue', !props.modelValue)"
  >
    <canvas
      v-show="props.modelValue"
      ref="canvasRef"
      aria-hidden="true"
      v-bind="stylex.attrs(styles.canvas)"
      style="image-rendering: pixelated"
    />
    <span v-bind="stylex.attrs(styles.frame)"><slot /></span>
  </button>
</template>
