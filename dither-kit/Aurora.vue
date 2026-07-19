<script lang="ts">
import { paintAurora, type AuroraParams } from "./aurora"
export type { AuroraParams }
export { paintAurora }
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"
import { BAYER4, clamp01, pixelMatrixFromSeed, pixelPrefersReducedMotion } from "./pixel"
import { hexToRgb } from "./palette"
import { createRasterBuffer, putRasterBuffer, type RasterBuffer } from "./raster"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "./precompile"
import { useCanvasVisibility } from "./use-visibility"

const props = withDefaults(
  defineProps<{
    colors?: string[]
    amplitude?: number
    blend?: number
    speed?: number
    opacity?: number
    dither?: number | boolean
    paused?: boolean
    dpr?: number
    mixBlendMode?: string
    seed?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    class?: string
  }>(),
  {
    colors: () => ["#5227FF", "#7CFF67", "#5227FF"],
    amplitude: 1,
    blend: 0.5,
    speed: 0.5,
    opacity: 1,
    dither: 1,
    paused: false,
    renderMode: "live",
  }
)

const CELL = 4
const MAX_COLS = 240
const MAX_ROWS = 150

const precompiled = computed(() => precompiledSrc(props.precompiled))
const params = computed<AuroraParams>(() => ({
  colors: (props.colors.length ? props.colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
  amplitude: props.amplitude,
  blend: props.blend,
  speed: props.speed,
  opacity: clamp01(props.opacity),
  dither: props.dither === true ? 1 : props.dither === false ? 0 : clamp01(props.dither),
}))
const matrix = computed(() => (props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4))

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let raf = 0
let ro: ResizeObserver | null = null
let restartToken = 0
let clock = 0
let lastPaint = 0
let buffer: RasterBuffer | null = null
let imageData: ImageData | undefined
const isVisible = useCanvasVisibility(wrapRef, () => wake())

function dprFactor(): number {
  const raw = props.dpr ?? (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1)
  return Math.max(0.5, Math.min(3, raw))
}

function measure(): CanvasRenderingContext2D | null {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  if (!wrap || !canvas) return null
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return null
  const box = wrap.getBoundingClientRect()
  const unit = CELL / dprFactor()
  const cols = Math.min(MAX_COLS, Math.max(8, Math.round(box.width / unit)))
  const rows = Math.min(MAX_ROWS, Math.max(8, Math.round(box.height / unit)))
  if (!buffer || buffer.width !== cols || buffer.height !== rows) {
    buffer = createRasterBuffer(cols, rows)
    imageData = undefined
    canvas.width = cols
    canvas.height = rows
  }
  return ctx
}

function paint(ctx: CanvasRenderingContext2D) {
  if (!buffer) return
  paintAurora(buffer, params.value, clock, matrix.value)
  imageData = putRasterBuffer(ctx, buffer, imageData)
}

function frame(now: number) {
  raf = 0
  if (!isVisible() || props.paused) return
  const ctx = measure()
  if (!ctx) return
  if (now - lastPaint < 33) {
    raf = requestAnimationFrame(frame)
    return
  }
  const dt = lastPaint ? Math.min(0.1, (now - lastPaint) / 1000) : 0
  lastPaint = now
  clock += dt
  paint(ctx)
  raf = requestAnimationFrame(frame)
}

function wake() {
  if (!raf && !props.paused && props.renderMode !== "static" && isVisible()) {
    lastPaint = 0
    raf = requestAnimationFrame(frame)
  }
}

function start() {
  const token = ++restartToken
  stop()
  if (precompiled.value) return
  void nextTick(() => {
    if (token !== restartToken || precompiled.value) return
    const ctx = measure()
    if (!ctx) return
    if (props.renderMode === "static" || pixelPrefersReducedMotion()) {
      clock = 4
      paint(ctx)
      return
    }
    paint(ctx)
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        if (raf) return
        const c = measure()
        if (c && props.paused) paint(c)
      })
      if (wrapRef.value) ro.observe(wrapRef.value)
    }
    raf = requestAnimationFrame(frame)
  })
}

function stop() {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
  ro?.disconnect()
  ro = null
}

onMounted(start)
watch(() => [props.seed, props.renderMode, precompiled.value, props.dpr], start, { flush: "post" })
watch(() => props.paused, (paused) => (paused ? stop() : wake()))
onBeforeUnmount(() => {
  restartToken += 1
  stop()
})
</script>

<template>
  <div
    ref="wrapRef"
    aria-hidden="true"
    :class="cn('relative block h-full w-full overflow-hidden', props.class)"
  >
    <img
      v-if="precompiled"
      :src="precompiled"
      alt=""
      class="absolute inset-0 h-full w-full object-fill"
      :style="{ imageRendering: 'pixelated', mixBlendMode: props.mixBlendMode as never }"
    />
    <canvas
      v-else
      ref="canvasRef"
      class="absolute inset-0 h-full w-full"
      :style="{ imageRendering: 'pixelated', mixBlendMode: props.mixBlendMode as never }"
    />
  </div>
</template>
