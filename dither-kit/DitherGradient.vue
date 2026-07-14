<script lang="ts">
import { rgb } from "./palette"
import {
  BAYER4,
  fillOf,
  type PixelBloomInput,
  type PixelColor,
} from "./pixel"

// Backing-resolution caps — a background wash never needs more cells than this.
const MAX_COLS = 960
const MAX_ROWS = 600

export type GradientDirection = "up" | "down" | "left" | "right"

type PaintSpec = {
  from: PixelColor
  to: PixelColor | "transparent"
  direction: GradientDirection
  cell: number
  opacity: number
}

function paintGradient(
  canvas: HTMLCanvasElement,
  bloomCanvas: HTMLCanvasElement | null,
  width: number,
  height: number,
  spec: PaintSpec
): void {
  const ctx = canvas.getContext("2d")
  if (!ctx || width <= 0 || height <= 0) return
  const cols = Math.min(MAX_COLS, Math.max(4, Math.round(width / spec.cell)))
  const rows = Math.min(MAX_ROWS, Math.max(4, Math.round(height / spec.cell)))
  canvas.width = cols
  canvas.height = rows

  const fromFill = fillOf(spec.from)
  const toFill = spec.to === "transparent" ? null : fillOf(spec.to)
  const o = spec.opacity

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const t =
        spec.direction === "up"
          ? 1 - (y + 0.5) / rows
          : spec.direction === "down"
            ? (y + 0.5) / rows
            : spec.direction === "left"
              ? 1 - (x + 0.5) / cols
              : (x + 0.5) / cols
      const density = 1 - t
      const lit = density > BAYER4[y & 3][x & 3]
      if (toFill) {
        ctx.fillStyle = rgb(lit ? fromFill : toFill, 1, o)
        ctx.fillRect(x, y, 1, 1)
      } else {
        const alpha = (lit ? 0.35 + 0.65 * density : 0.12 * density) * o
        if (alpha <= 0.004) continue
        ctx.fillStyle = rgb(fromFill, 1, alpha)
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  const bloomCtx = bloomCanvas?.getContext("2d") ?? null
  if (bloomCanvas && bloomCtx) {
    bloomCanvas.width = cols
    bloomCanvas.height = rows
    bloomCtx.drawImage(canvas, 0, 0)
  }
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"
import { pixelBloomStyle } from "./pixel"
import { kitFromSeed } from "./dither-paint"

const props = defineProps<{
  from?: PixelColor
  to?: PixelColor | "transparent"
  direction?: GradientDirection
  cell?: number
  opacity?: number
  bloom?: PixelBloomInput
  seed?: number
  class?: string
}>()

const s = computed(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
const effFrom = computed(() => props.from ?? s.value?.hue ?? "blue")
const effTo = computed(() => props.to ?? "transparent")
const effDirection = computed(() => props.direction ?? s.value?.direction ?? "up")
const effCell = computed(() => props.cell ?? s.value?.cell ?? 3)
const effOpacity = computed(() => props.opacity ?? s.value?.opacity ?? 1)
const effBloom = computed(
  () => props.bloom ?? (props.seed !== undefined ? props.seed : "off")
)

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const bloomRef = ref<HTMLCanvasElement | null>(null)
const bloomStyle = computed(() => pixelBloomStyle(effBloom.value))

let ro: ResizeObserver | null = null
function paint() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  if (!wrap || !canvas) return
  const box = wrap.getBoundingClientRect()
  paintGradient(canvas, bloomRef.value, box.width, box.height, {
    from: effFrom.value,
    to: effTo.value,
    direction: effDirection.value,
    cell: effCell.value,
    opacity: effOpacity.value,
  })
}

onMounted(() => {
  paint()
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(paint)
    if (wrapRef.value) ro.observe(wrapRef.value)
  }
})
watch([effFrom, effTo, effDirection, effCell, effOpacity, effBloom], paint)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div
    ref="wrapRef"
    aria-hidden="true"
    :class="cn('pointer-events-none absolute inset-0 overflow-hidden', props.class)"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 h-full w-full"
      style="image-rendering: pixelated"
    />
    <canvas
      v-if="bloomStyle"
      ref="bloomRef"
      class="absolute inset-0 h-full w-full"
      :style="{
        filter: bloomStyle.filter,
        opacity: bloomStyle.opacity,
        mixBlendMode: bloomStyle.mixBlendMode,
        imageRendering: bloomStyle.imageRendering,
      }"
    />
  </div>
</template>
