<!-- Generated from ../tailwind/DitherBadge.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import { rgb } from "../engine/palette"
import { BAYER4, clamp01, fillOf, type PixelColor } from "../engine/pixel"
import type { Rgb } from "../engine/palette"
import * as stylex from "@stylexjs/stylex"

export type BadgeVariant = "gradient" | "solid" | "dotted" | "hatched"

const CELL = 2

/** DitherButton's fill at rest intensity — texture capped by the 1px brighter
 * edge lines, no hover machinery. */
function paintBadge(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  fill: Rgb,
  variant: BadgeVariant,
  matrix: number[][] = BAYER4,
): void {
  ctx.clearRect(0, 0, cols, rows)
  const bias = variant === "dotted" ? 0.12 : 0
  for (let y = 0; y < rows; y++) {
    const density = variant === "gradient" ? 0.25 + 0.75 * ((y + 0.5) / rows) : variant === "dotted" ? 0.5 : 0.75
    for (let x = 0; x < cols; x++) {
      if (variant === "hatched" && ((x + y) & 3) >= 2) continue
      const lit = variant === "solid" || density > matrix[y & 3][x & 3] - bias
      if (variant === "dotted" && !lit) continue
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

const styles = stylex.create({
  row: {
    position: "relative",
    isolation: "isolate",
    display: "inline-flex",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: "0.25rem",
    paddingInline: "0.5rem",
    paddingBlock: "0.125rem",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--foreground)",
  },
  canvas: { position: "absolute", inset: "0px", zIndex: "-10", height: "100%", width: "100%" },
})
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn, type StyleProp } from "./lib"
import { pixelMatrixFromSeed } from "../engine/pixel"
import { kitFromSeed } from "../engine/dither-paint"

const props = withDefaults(
  defineProps<{
    color?: PixelColor
    variant?: BadgeVariant
    seed?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  {},
)
const s = computed(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
const matrix = computed(() => (props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4))
const color = computed<PixelColor>(() => props.color ?? s.value?.hue ?? "blue")
const variant = computed<BadgeVariant>(() => props.variant ?? s.value?.variant ?? "gradient")

const wrapRef = ref<HTMLSpanElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let ro: ResizeObserver | null = null

function paint() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d", { willReadFrequently: true })
  if (!wrap || !canvas || !ctx) return
  const box = wrap.getBoundingClientRect()
  const cols = Math.max(4, Math.round(box.width / CELL))
  const rows = Math.max(4, Math.round(box.height / CELL))
  canvas.width = cols
  canvas.height = rows
  paintBadge(ctx, cols, rows, fillOf(color.value), variant.value, matrix.value)
}

onMounted(() => {
  requestAnimationFrame(() => {
    paint()
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(paint)
      if (wrapRef.value) ro.observe(wrapRef.value)
    }
  })
})
watch([color, variant, matrix], paint)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <span ref="wrapRef" :class="cn(styles.row, props.xstyle, props.class)">
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      v-bind="stylex.attrs(styles.canvas)"
      style="image-rendering: pixelated"
    />
    <slot />
  </span>
</template>
