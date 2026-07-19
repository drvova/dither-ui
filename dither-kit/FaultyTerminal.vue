<script lang="ts">
import { paintFaultyTerminal, type FaultyTerminalParams } from "./faulty-terminal"
export type { FaultyTerminalParams }
export { paintFaultyTerminal }
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { BAYER4, clamp01, fillOf, pixelMatrixFromSeed, type PixelColor } from "./pixel"
import type { RasterBuffer } from "./raster"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "./precompile"
import { useDitherBackground } from "./use-dither-background"

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
    mixBlendMode?: string
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

useDitherBackground({
  wrapRef,
  canvasRef,
  cell: CELL,
  maxCols: MAX_COLS,
  maxRows: MAX_ROWS,
  dpr: () => 1,
  paused: () => props.pause,
  renderMode: () => props.renderMode,
  precompiled: () => precompiled.value,
  restart: () => [props.seed, props.renderMode, precompiled.value, props.pageLoadAnimation],
  timeScale: () => props.timeScale,
  staticClock: 3,
  render: (buffer: RasterBuffer, clock: number, _dt: number, elapsed: number) => {
    const fade = props.pageLoadAnimation ? clamp01(elapsed / 900) : 1
    paintFaultyTerminal(buffer, params.value, clock, matrix.value, props.mouseReact ? mouse : null, fade)
  },
})

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
})
onBeforeUnmount(() => {
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
