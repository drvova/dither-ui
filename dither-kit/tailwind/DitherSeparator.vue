<script lang="ts">
import { cellCanvas } from "../engine/raster"
import { BAYER4, fillOf } from "../engine/pixel"

export type SeparatorOrientation = "horizontal" | "vertical"

const CELL = 2
const GREY = fillOf("grey")

/** A one-cell line whose pixels drop out toward both ends through the Bayer
 * matrix — DitherImage's edge-dissolve recipe applied to a rule. */
function paintSeparator(
  ctx: CanvasRenderingContext2D,
  cells: number,
  vertical: boolean,
  matrix: number[][] = BAYER4,
): void {
  const px = cellCanvas(ctx, vertical ? 1 : cells, vertical ? cells : 1)
  const half = cells / 2
  for (let i = 0; i < cells; i++) {
    const e = 1 - Math.abs(i + 0.5 - half) / half // 1 at center, 0 at ends
    const x = vertical ? 0 : i
    const y = vertical ? i : 0
    if (e < 1 && e * e <= matrix[y & 3][x & 3]) continue
    px.cell(x, y, GREY, 0.35 + 0.45 * e)
  }
  px.flush()
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    orientation?: SeparatorOrientation
    class?: string
  }>(),
  { orientation: "horizontal" },
)

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let ro: ResizeObserver | null = null

function paint() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d", { willReadFrequently: true })
  if (!wrap || !canvas || !ctx) return
  const box = wrap.getBoundingClientRect()
  const vertical = props.orientation === "vertical"
  const cells = Math.max(4, Math.round((vertical ? box.height : box.width) / CELL))
  canvas.width = vertical ? 1 : cells
  canvas.height = vertical ? cells : 1
  paintSeparator(ctx, cells, vertical)
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
watch(() => props.orientation, paint)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div
    ref="wrapRef"
    role="separator"
    :aria-orientation="props.orientation"
    :class="cn('relative', props.orientation === 'vertical' ? 'h-full w-[2px]' : 'h-[2px] w-full', props.class)"
  >
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      class="absolute inset-0 h-full w-full"
      style="image-rendering: pixelated"
    />
  </div>
</template>
