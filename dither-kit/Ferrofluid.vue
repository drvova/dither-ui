<script lang="ts">
import { paintFerrofluid, type FerrofluidParams } from "./ferrofluid"
export type { FerrofluidParams }
export { paintFerrofluid }

export type FlowDirection = "up" | "down" | "left" | "right"

// Sampling drift is the negative of the on-screen direction: to make blobs
// travel down the screen, the field is read from the row above.
const FLOW_VEC: Record<FlowDirection, [number, number]> = {
  up: [0, 1],
  down: [0, -1],
  left: [1, 0],
  right: [-1, 0],
}
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
    speed?: number
    scale?: number
    turbulence?: number
    fluidity?: number
    rimWidth?: number
    sharpness?: number
    shimmer?: number
    glow?: number
    flowDirection?: FlowDirection
    opacity?: number
    dither?: number | boolean
    mouseInteraction?: boolean
    mouseStrength?: number
    mouseRadius?: number
    mouseDampening?: number
    mixBlendMode?: string
    paused?: boolean
    dpr?: number
    seed?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    class?: string
  }>(),
  {
    colors: () => ["#27FF64", "#7CFF67", "#A8FFB6"],
    speed: 0.5,
    scale: 1.6,
    turbulence: 1,
    fluidity: 0.1,
    rimWidth: 0.2,
    sharpness: 2.5,
    shimmer: 1.5,
    glow: 2,
    flowDirection: "down",
    opacity: 1,
    dither: 1,
    mouseInteraction: true,
    mouseStrength: 1,
    mouseRadius: 0.35,
    mouseDampening: 0.15,
    paused: false,
    renderMode: "live",
  }
)

// A ~4px backing cell keeps the fbm affordable; dpr scales it for sharpness.
const CELL = 4
const MAX_COLS = 240
const MAX_ROWS = 150

const precompiled = computed(() => precompiledSrc(props.precompiled))
const params = computed<FerrofluidParams>(() => {
  const flow = FLOW_VEC[props.flowDirection]
  return {
    colors: (props.colors.length ? props.colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
    speed: props.speed,
    scale: props.scale,
    turbulence: props.turbulence,
    fluidity: props.fluidity,
    rimWidth: props.rimWidth,
    sharpness: props.sharpness,
    shimmer: props.shimmer,
    glow: props.glow,
    flowX: flow[0],
    flowY: flow[1],
    opacity: clamp01(props.opacity),
    dither: props.dither === true ? 1 : props.dither === false ? 0 : clamp01(props.dither),
    mouseStrength: props.mouseStrength,
    mouseRadius: props.mouseRadius,
  }
})
const matrix = computed(() => (props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4))

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const target = { x: 0.5, y: 0.5 }
const mouse = { x: 0.5, y: 0.5 }

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

/** (Re)size the backing buffer to the element, deferring the read to rAF so a
 * wall of these mounting together never forces reflow inside flushJobs. */
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
  paintFerrofluid(buffer, params.value, clock, matrix.value, props.mouseInteraction ? mouse : null)
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
  // Eased pointer follow — mouseDampening is the time constant in seconds.
  const tau = props.mouseDampening
  if (tau <= 0 || dt <= 0) {
    mouse.x = target.x
    mouse.y = target.y
  } else {
    const k = 1 - Math.exp(-dt / tau)
    mouse.x += (target.x - mouse.x) * k
    mouse.y += (target.y - mouse.y) * k
  }
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

function onPointerMove(e: PointerEvent) {
  const c = canvasRef.value
  if (!c) return
  const r = c.getBoundingClientRect()
  if (r.width <= 0 || r.height <= 0) return
  target.x = (e.clientX - r.left) / r.width
  target.y = (e.clientY - r.top) / r.height
}

onMounted(() => {
  if (typeof window !== "undefined") window.addEventListener("pointermove", onPointerMove, { passive: true })
  start()
})
watch(
  () => [props.seed, props.renderMode, precompiled.value, props.dpr],
  start,
  { flush: "post" }
)
watch(() => props.paused, (paused) => (paused ? stop() : wake()))
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
