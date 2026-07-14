<script lang="ts">
import { rgb } from "./palette"
import { BAYER4, clamp01, fillOf, type PixelColor } from "./pixel"
import type { Rgb } from "./palette"

export type BadgeVariant = "gradient" | "solid" | "dotted" | "hatched"

const CELL = 2

/** DitherButton's fill at rest intensity — texture capped by the 1px brighter
 * edge lines, no hover machinery. */
function paintBadge(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  fill: Rgb,
  variant: BadgeVariant
): void {
  ctx.clearRect(0, 0, cols, rows)
  const bias = variant === "dotted" ? 0.12 : 0
  for (let y = 0; y < rows; y++) {
    const density =
      variant === "gradient"
        ? 0.25 + 0.75 * ((y + 0.5) / rows)
        : variant === "dotted"
          ? 0.5
          : 0.75
    for (let x = 0; x < cols; x++) {
      if (variant === "hatched" && ((x + y) & 3) >= 2) continue
      const lit = variant === "solid" || density > BAYER4[y & 3][x & 3] - bias
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
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"
import { kitFromSeed } from "./dither-paint"

const props = withDefaults(
  defineProps<{
    color?: PixelColor
    variant?: BadgeVariant
    seed?: number
    class?: string
  }>(),
  {}
)
const s = computed(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
const color = computed<PixelColor>(() => props.color ?? s.value?.hue ?? "blue")
const variant = computed<BadgeVariant>(() => props.variant ?? s.value?.variant ?? "gradient")

const wrapRef = ref<HTMLSpanElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let ro: ResizeObserver | null = null

function paint() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d")
  if (!wrap || !canvas || !ctx) return
  const box = wrap.getBoundingClientRect()
  const cols = Math.max(4, Math.round(box.width / CELL))
  const rows = Math.max(4, Math.round(box.height / CELL))
  canvas.width = cols
  canvas.height = rows
  paintBadge(ctx, cols, rows, fillOf(color.value), variant.value)
}

onMounted(() => {
  paint()
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(paint)
    if (wrapRef.value) ro.observe(wrapRef.value)
  }
})
watch([color, variant], paint)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <span
    ref="wrapRef"
    :class="
      cn(
        'relative isolate inline-flex items-center overflow-hidden rounded px-2 py-0.5 font-mono text-[10px] text-foreground',
        props.class
      )
    "
  >
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      class="absolute inset-0 -z-10 h-full w-full"
      style="image-rendering: pixelated"
    />
    <slot />
  </span>
</template>
