<script lang="ts">
import { rgb } from "./palette"
import {
  BAYER4,
  clamp01,
  fillOf,
  type PixelBloomInput,
  type PixelColor,
  pixelPrefersReducedMotion,
} from "./pixel"


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
  intensity: number,
  matrix: number[][] = BAYER4
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
        density > matrix[y & 3][x & 3] - 0.1 * intensity - bias
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
import { pixelBloomStyle, pixelMatrixFromSeed } from "./pixel"
import { kitFromSeed } from "./dither-paint"
import { CONTROL_BUTTON } from "./control"

const props = withDefaults(
  defineProps<{
    color?: PixelColor
    variant?: ButtonVariant
    bloom?: PixelBloomInput
    cell?: number // css px per dither cell — chunkiness
    seed?: number
    type?: "button" | "submit" | "reset"
    loading?: boolean
    disabled?: boolean
    class?: string
  }>(),
  { type: "button", loading: false, disabled: false }
)
const s = computed(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
const matrix = computed(() => props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4)
const color = computed<PixelColor>(() => props.color ?? s.value?.hue ?? "blue")
const variant = computed<ButtonVariant>(() => props.variant ?? s.value?.variant ?? "gradient")
const bloom = computed<PixelBloomInput>(
  () => props.bloom ?? (props.seed !== undefined ? props.seed : "off")
)
const cell = computed(() => props.cell ?? s.value?.cell ?? 2)

const buttonRef = ref<HTMLButtonElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const bloomRef = ref<HTMLCanvasElement | null>(null)
const bloomStyle = computed(() => pixelBloomStyle(bloom.value))

let teardown: (() => void) | undefined

function init(): (() => void) | undefined {
  const button = buttonRef.value
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d")
  if (!button || !canvas || !ctx) return undefined
  const bloomCanvas = bloomRef.value
  const bloomCtx = bloomCanvas?.getContext("2d") ?? null
  const state: PaintState = { fill: fillOf(color.value), variant: variant.value }
  const reduce = pixelPrefersReducedMotion()

  let cols = 0
  let rows = 0
  let intensity = 0
  let target = 0
  let hovered = false
  let raf = 0

  const paint = () => paintButton(ctx, bloomCtx, cols, rows, state, intensity, matrix.value)

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
    const cellPx = Math.max(1, cell.value)
    cols = Math.max(4, Math.round(box.width / cellPx))
    rows = Math.max(4, Math.round(box.height / cellPx))
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
  const down = () => { if (!button.disabled) setTarget(1.5) }
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
watch([color, variant, bloom, cell, matrix, () => props.loading, () => props.disabled], () => {
  teardown?.()
  teardown = init()
})
onBeforeUnmount(() => teardown?.())
</script>

<template>
  <button
    ref="buttonRef"
    :type="props.type"
    :disabled="props.loading || props.disabled"
    :aria-busy="props.loading || undefined"
    :class="
      cn(
        CONTROL_BUTTON,
        'relative isolate inline-flex min-h-10 items-center justify-center gap-2 overflow-hidden rounded-md px-4 py-2 font-mono text-xs text-foreground transition-[opacity,scale] active:scale-[0.96] motion-reduce:transition-none',
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
    <span v-if="props.loading" aria-hidden="true" class="relative grid grid-cols-3 gap-0.5">
      <span v-for="n in 3" :key="n" class="size-1 bg-current opacity-70" />
    </span>
    <span class="relative"><slot /></span>
  </button>
</template>
