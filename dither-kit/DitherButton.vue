<script lang="ts">
import { rgb } from "./palette"
import {
  BAYER4,
  clamp01,
  fillOf,
  type PixelBloom,
  type PixelColor,
  pixelPrefersReducedMotion,
} from "./pixel"

const CELL = 2 // css px per dither cell — same chunk as the charts

export type ButtonVariant = "gradient" | "dotted" | "hatched" | "solid"

type PaintState = { fill: [number, number, number]; variant: ButtonVariant }

/** Paint one frame of the button fill — ordered-dither texture capped by a soft
 * outline, with `intensity` (0 rest, 1 hover, ~1.5 pressed) lifting density. */
function paintButton(
  ctx: CanvasRenderingContext2D,
  bloomCtx: CanvasRenderingContext2D | null,
  cols: number,
  rows: number,
  { fill, variant }: PaintState,
  intensity: number
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
      const lit =
        variant === "solid" ||
        density > BAYER4[y & 3][x & 3] - 0.1 * intensity - bias
      if (variant === "dotted" && !lit) continue
      const k = (0.3 + density * 0.7) * (1 + 0.22 * intensity)
      ctx.fillStyle = rgb(fill, 1, clamp01(lit ? k : k * 0.4))
      ctx.fillRect(x, y, 1, 1)
    }
  }
  ctx.fillStyle = rgb(fill, 1, clamp01(0.5 + 0.25 * intensity))
  ctx.fillRect(0, 0, cols, 1)
  ctx.fillRect(0, rows - 1, cols, 1)
  ctx.fillRect(0, 0, 1, rows)
  ctx.fillRect(cols - 1, 0, 1, rows)
  if (bloomCtx) {
    bloomCtx.clearRect(0, 0, cols, rows)
    bloomCtx.drawImage(ctx.canvas, 0, 0)
  }
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"
import { pixelBloomStyle } from "./pixel"

const props = withDefaults(
  defineProps<{
    color?: PixelColor
    variant?: ButtonVariant
    bloom?: PixelBloom
    class?: string
  }>(),
  { color: "blue", variant: "gradient", bloom: "off" }
)

const buttonRef = ref<HTMLButtonElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const bloomRef = ref<HTMLCanvasElement | null>(null)
const bloomStyle = computed(() => pixelBloomStyle(props.bloom))

let teardown: (() => void) | undefined

function init(): (() => void) | undefined {
  const button = buttonRef.value
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d")
  if (!button || !canvas || !ctx) return undefined
  const bloomCanvas = bloomRef.value
  const bloomCtx = bloomCanvas?.getContext("2d") ?? null
  const state: PaintState = { fill: fillOf(props.color), variant: props.variant }
  const reduce = pixelPrefersReducedMotion()

  let cols = 0
  let rows = 0
  let intensity = 0
  let target = 0
  let hovered = false
  let raf = 0

  const paint = () => paintButton(ctx, bloomCtx, cols, rows, state, intensity)

  const tick = () => {
    const d = target - intensity
    if (Math.abs(d) < 0.01) {
      intensity = target
      paint()
      raf = 0
      return
    }
    intensity += d * 0.16
    paint()
    raf = requestAnimationFrame(tick)
  }

  const setTarget = (t: number) => {
    target = t
    if (reduce) {
      intensity = t
      paint()
    } else if (!raf) {
      raf = requestAnimationFrame(tick)
    }
  }

  const resize = () => {
    const box = button.getBoundingClientRect()
    cols = Math.max(4, Math.round(box.width / CELL))
    rows = Math.max(4, Math.round(box.height / CELL))
    canvas.width = cols
    canvas.height = rows
    if (bloomCanvas) {
      bloomCanvas.width = cols
      bloomCanvas.height = rows
    }
    paint()
  }
  resize()

  const enter = () => {
    hovered = true
    setTarget(1)
  }
  const leave = () => {
    hovered = false
    setTarget(0)
  }
  const down = () => setTarget(1.5)
  const up = () => setTarget(hovered ? 1 : 0)
  button.addEventListener("pointerenter", enter)
  button.addEventListener("pointerleave", leave)
  button.addEventListener("pointerdown", down)
  button.addEventListener("pointerup", up)
  button.addEventListener("pointercancel", up)

  const ro =
    typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null
  ro?.observe(button)

  return () => {
    if (raf) cancelAnimationFrame(raf)
    button.removeEventListener("pointerenter", enter)
    button.removeEventListener("pointerleave", leave)
    button.removeEventListener("pointerdown", down)
    button.removeEventListener("pointerup", up)
    button.removeEventListener("pointercancel", up)
    ro?.disconnect()
  }
}

onMounted(() => {
  teardown = init()
})
watch(
  () => [props.color, props.variant, props.bloom],
  () => {
    teardown?.()
    teardown = init()
  }
)
onBeforeUnmount(() => teardown?.())
</script>

<template>
  <button
    ref="buttonRef"
    type="button"
    :class="
      cn(
        'relative isolate overflow-hidden rounded-md px-4 py-2 font-mono text-xs text-foreground transition-opacity focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40',
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
    <canvas
      v-if="bloomStyle"
      ref="bloomRef"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      :style="{
        filter: bloomStyle.filter,
        opacity: bloomStyle.opacity,
        mixBlendMode: bloomStyle.mixBlendMode,
        imageRendering: bloomStyle.imageRendering,
      }"
    />
    <span class="relative"><slot /></span>
  </button>
</template>
