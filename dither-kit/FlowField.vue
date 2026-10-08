<script lang="ts">
import { paintFlowField, fadeRasterAlpha, type FlowFieldParams } from "./flow-field"
export type { FlowFieldParams }
export { paintFlowField, fadeRasterAlpha }
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn } from "./lib"
import { BAYER4, clamp01, pixelMatrixFromSeed } from "./pixel"
import { hexToRgb } from "./palette"
import type { RasterBuffer } from "./raster"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "./precompile"
import { useDitherBackground } from "./use-dither-background"

const props = withDefaults(
  defineProps<{
    colors?: string[]
    count?: number
    speed?: number
    scale?: number
    fade?: number
    glow?: number
    opacity?: number
    dither?: number | boolean
    /** edge fade mask on the wrapper: soft radial pool, horizontal sweep, or none. */
    mask?: "radial" | "linear" | "none"
    paused?: boolean
    /** the brief's lock: 60 keeps every vsync; 0 = the smooth ~30fps throttle. */
    frameRate?: number
    dpr?: number
    mixBlendMode?: string
    seed?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    class?: string
  }>(),
  {
    colors: () => ["#f4f8ff", "#c9dbff", "#7ba3ee"],
    count: 2400,
    speed: 0.7,
    scale: 1.4,
    fade: 0.96,
    glow: 1,
    opacity: 1,
    dither: 1,
    mask: "radial",
    paused: false,
    frameRate: 60,
    renderMode: "live",
  }
)

const CELL = 3
const MAX_COLS = 320
const MAX_ROWS = 200

const precompiled = computed(() => precompiledSrc(props.precompiled))
const params = computed<FlowFieldParams>(() => ({
  colors: (props.colors.length ? props.colors : ["#f4f8ff"]).slice(0, 8).map(hexToRgb),
  count: props.count,
  speed: props.speed,
  scale: props.scale,
  fade: clamp01(props.fade),
  glow: props.glow,
  opacity: clamp01(props.opacity),
  dither: props.dither === true ? 1 : props.dither === false ? 0 : clamp01(props.dither),
  seed: props.seed ?? 1,
}))
const matrix = computed(() => (props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4))
const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const MASKS: Record<string, string | undefined> = {
  radial: "radial-gradient(120% 120% at 50% 40%, black 45%, transparent 100%)",
  linear: "linear-gradient(to bottom, black 60%, transparent 100%)",
}

useDitherBackground({
  wrapRef,
  canvasRef,
  cell: CELL,
  maxCols: MAX_COLS,
  maxRows: MAX_ROWS,
  dpr: () => props.dpr,
  paused: () => props.paused,
  frameRate: () => props.frameRate,
  renderMode: () => props.renderMode,
  precompiled: () => precompiled.value,
  restart: () => [props.seed, props.renderMode, precompiled.value, props.dpr, props.count],
  render: (buffer: RasterBuffer, clock: number, dt: number, _elapsed: number) =>
    paintFlowField(buffer, params.value, clock, dt, matrix.value),
})
</script>

<template>
  <div
    ref="wrapRef"
    aria-hidden="true"
    :class="cn('relative block h-full w-full overflow-hidden', props.class)"
    :style="{
      maskImage: MASKS[props.mask],
      WebkitMaskImage: MASKS[props.mask],
      mixBlendMode: props.mixBlendMode as never,
    }"
  >
    <img v-if="precompiled" :src="precompiled" alt="" class="absolute inset-0 h-full w-full object-fill" :style="{ imageRendering: 'pixelated' }" />
    <canvas v-else ref="canvasRef" class="absolute inset-0 h-full w-full" :style="{ imageRendering: 'pixelated' }" />
  </div>
</template>
