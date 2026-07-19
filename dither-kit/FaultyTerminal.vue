<script lang="ts">
import { paintFaultyTerminal, type FaultyTerminalParams } from "./faulty-terminal"
export type { FaultyTerminalParams }
export { paintFaultyTerminal }
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"
import { BAYER4, clamp01, fillOf, pixelMatrixFromSeed, pixelPrefersReducedMotion, type PixelColor } from "./pixel"
import { createRasterBuffer, putRasterBuffer, type RasterBuffer } from "./raster"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "./precompile"
import { useCanvasVisibility } from "./use-visibility"

const props = withDefaults(
  defineProps<{
    scale?: number
    gridMul?: [number, number]
    digitSize?: number
    timeScale?: number
    pause?: boolean
    scanlineIntensity?: number
    glitchAmount?: number
    flickerAmount?: number
    noiseAmp?: number
    chromaticAberration?: number
    dither?: number | boolean
    curvature?: number
    tint?: PixelColor
    mouseReact?: boolean
    mouseStrength?: number
    pageLoadAnimation?: boolean
    brightness?: number
    seed?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    class?: string
  }>(),
  {
    scale: 1.5,
    gridMul: () => [2, 1],
    digitSize: 1.2,
    timeScale: 1,
    pause: false,
    scanlineIntensity: 1,
    glitchAmount: 1,
    flickerAmount: 1,
    noiseAmp: 1,
    chromaticAberration: 0,
    dither: 0,
    curvature: 0,
    tint: "#ffffff",
    mouseReact: true,
    mouseStrength: 0.5,
    pageLoadAnimation: false,
    brightness: 1,
    renderMode: "live",
  }
)

// A background cell of ~3px keeps the fbm affordable; low caps because the
// wall is decorative and the pixelated upscale is part of the look.
const CELL = 3
const MAX_COLS = 220
const MAX_ROWS = 140

const precompiled = computed(() => precompiledSrc(props.precompiled))
const params = computed<FaultyTerminalParams>(() => ({
  scale: props.scale,
  gridMulX: props.gridMul[0],
  gridMulY: props.gridMul[1],
  digitSize: props.digitSize,
  scanlineIntensity: props.scanlineIntensity,
  glitchAmount: props.glitchAmount,
  flickerAmount: props.flickerAmount,
  noiseAmp: props.noiseAmp,
  chromaticAberration: props.chromaticAberration,
  dither: props.dither === true ? 1 : props.dither === false ? 0 : clamp01(props.dither),
  curvature: props.curvature,
  tint: fillOf(props.tint),
  brightness: props.brightness,
  mouseStrength: props.mouseStrength,
}))
const matrix = computed(() => (props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4))

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const mouse = { x: 0.5, y: 0.5 }

let raf = 0
let ro: ResizeObserver | null = null
let restartToken = 0
let clock = 0
let loadStart = 0
let lastPaint = 0
let buffer: RasterBuffer | null = null
let imageData: ImageData | undefined
const isVisible = useCanvasVisibility(wrapRef, () => wake())

/** (Re)size the backing buffer to the element, deferring the read to rAF so a
 * wall of these mounting together never forces reflow inside flushJobs. */
function measure(): CanvasRenderingContext2D | null {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  if (!wrap || !canvas) return null
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return null
  const box = wrap.getBoundingClientRect()
  const cols = Math.min(MAX_COLS, Math.max(8, Math.round(box.width / CELL)))
  const rows = Math.min(MAX_ROWS, Math.max(8, Math.round(box.height / CELL)))
  if (!buffer || buffer.width !== cols || buffer.height !== rows) {
    buffer = createRasterBuffer(cols, rows)
    imageData = undefined
    canvas.width = cols
    canvas.height = rows
  }
  return ctx
}

function paint(ctx: CanvasRenderingContext2D, fade: number) {
  if (!buffer) return
  paintFaultyTerminal(buffer, params.value, clock, matrix.value, props.mouseReact ? mouse : null, fade)
  imageData = putRasterBuffer(ctx, buffer, imageData)
}

function frame(now: number) {
  raf = 0
  if (!isVisible() || props.pause) return
  const ctx = measure()
  if (!ctx) return
  if (now - lastPaint < 33) {
    raf = requestAnimationFrame(frame)
    return
  }
  const dt = lastPaint ? Math.min(0.1, (now - lastPaint) / 1000) : 0
  lastPaint = now
  clock += dt * props.timeScale
  if (!loadStart) loadStart = now
  const fade = props.pageLoadAnimation ? clamp01((now - loadStart) / 900) : 1
  paint(ctx, fade)
  raf = requestAnimationFrame(frame)
}

function wake() {
  if (!raf && !props.pause && props.renderMode !== "static" && isVisible()) {
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
    // A single settled frame for static / reduced-motion / paused states.
    if (props.renderMode === "static" || pixelPrefersReducedMotion()) {
      clock = 3
      paint(ctx, 1)
      return
    }
    paint(ctx, props.pageLoadAnimation ? 0 : 1)
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        if (raf) return
        const c = measure()
        if (c && (props.pause || props.renderMode === "static")) paint(c, 1)
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

function onPointerMove(e: PointerEvent) {
  const c = canvasRef.value
  if (!c) return
  const r = c.getBoundingClientRect()
  if (r.width <= 0 || r.height <= 0) return
  mouse.x = (e.clientX - r.left) / r.width
  mouse.y = (e.clientY - r.top) / r.height
}

onMounted(() => {
  if (typeof window !== "undefined") window.addEventListener("pointermove", onPointerMove, { passive: true })
  start()
})
watch(
  () => [props.seed, props.renderMode, precompiled.value, props.pageLoadAnimation],
  start,
  { flush: "post" }
)
watch(() => props.pause, (paused) => (paused ? stop() : wake()))
onBeforeUnmount(() => {
  restartToken += 1
  stop()
  if (typeof window !== "undefined") window.removeEventListener("pointermove", onPointerMove)
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
      style="image-rendering: pixelated"
    />
    <canvas
      v-else
      ref="canvasRef"
      class="absolute inset-0 h-full w-full"
      style="image-rendering: pixelated"
    />
  </div>
</template>
