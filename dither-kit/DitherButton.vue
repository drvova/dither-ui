<script lang="ts">
import type { PixelBloomInput, PixelColor } from "./pixel"
import {
  precompiledSrc,
  renderDitherButton,
  type DitherRenderMode,
  type PrecompiledDither,
} from "./precompile"
import { putRasterBuffer, type RasterBuffer } from "./raster"

export type ButtonVariant = "gradient" | "dotted" | "hatched" | "solid"
export type { DitherRenderMode, PrecompiledDither }
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"
import { pixelBloomStyle, pixelPrefersReducedMotion } from "./pixel"
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
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
  }>(),
  { type: "button", loading: false, disabled: false }
)
const s = computed(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
const precompiled = computed(() => precompiledSrc(props.precompiled))
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
let restartToken = 0

function init(): (() => void) | undefined {
  if (precompiled.value) return undefined
  const button = buttonRef.value
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d")
  if (!button || !canvas || !ctx) return undefined
  const bloomCanvas = bloomRef.value
  const bloomCtx = bloomCanvas?.getContext("2d") ?? null
  const reduce = pixelPrefersReducedMotion()
  const animated = props.renderMode !== "static" && !reduce

  let cols = 0
  let rows = 0
  let intensity = 0
  let target = 0
  let hovered = false
  let raf = 0
  let raster: RasterBuffer | undefined
  let imageData: ImageData | undefined

  const paint = () => {
    raster = renderDitherButton(
      {
        width: cols,
        height: rows,
        color: color.value,
        variant: variant.value,
        cell: 1,
        intensity,
        seed: props.seed,
      },
      raster
    )
    imageData = putRasterBuffer(ctx, raster, imageData)
    if (bloomCanvas && bloomCtx) {
      bloomCtx.clearRect(0, 0, cols, rows)
      bloomCtx.drawImage(canvas, 0, 0)
    }
  }

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
    } else if (animated && !raf) {
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
  if (animated) {
    button.addEventListener("pointerenter", enter)
    button.addEventListener("pointerleave", leave)
    button.addEventListener("pointerdown", down)
    button.addEventListener("pointerup", up)
    button.addEventListener("pointercancel", up)
  }

  const ro =
    props.renderMode !== "static" && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(resize)
      : null
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

function restartRuntime() {
  const token = ++restartToken
  teardown?.()
  teardown = undefined
  if (precompiled.value) return
  void nextTick(() => {
    if (token !== restartToken || precompiled.value) return
    teardown = init()
  })
}

onMounted(restartRuntime)
watch(
  [
    color,
    variant,
    bloom,
    cell,
    precompiled,
    () => props.renderMode,
    () => props.loading,
    () => props.disabled,
  ],
  restartRuntime,
  { flush: "post" }
)
onBeforeUnmount(() => {
  restartToken += 1
  teardown?.()
})
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
    <img
      v-if="precompiled"
      :src="precompiled"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 -z-10 h-full w-full object-fill"
      style="image-rendering: pixelated"
    />
    <canvas
      v-else
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
