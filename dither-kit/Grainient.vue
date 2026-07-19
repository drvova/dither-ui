<script lang="ts">
import { paintGrainient, type GrainientParams } from "./grainient"
export type { GrainientParams }
export { paintGrainient }
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
    angle?: number
    grain?: number
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
    colors: () => ["#5227FF", "#7CFF67"],
    angle: 0.6,
    grain: 0.4,
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
const params = computed<GrainientParams>(() => ({
  colors: (props.colors.length ? props.colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
  angle: props.angle,
  grain: props.grain,
  speed: props.speed,
  opacity: clamp01(props.opacity),
  dither: props.dither === true ? 1 : props.dither === false ? 0 : clamp01(props.dither),
}))
const matrix = computed(() => (props.seed !== undefined ? pixelMatrixFromSeed(props.seed) : BAYER4))
const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

useDitherBackground({
  wrapRef,
  canvasRef,
  cell: CELL,
  maxCols: MAX_COLS,
  maxRows: MAX_ROWS,
  dpr: () => props.dpr,
  paused: () => props.paused,
  renderMode: () => props.renderMode,
  precompiled: () => precompiled.value,
  restart: () => [props.seed, props.renderMode, precompiled.value, props.dpr],
  render: (buffer: RasterBuffer, clock: number) => paintGrainient(buffer, params.value, clock, matrix.value),
})
</script>

<template>
  <div ref="wrapRef" aria-hidden="true" :class="cn('relative block h-full w-full overflow-hidden', props.class)">
    <img v-if="precompiled" :src="precompiled" alt="" class="absolute inset-0 h-full w-full object-fill" :style="{ imageRendering: 'pixelated', mixBlendMode: props.mixBlendMode as never }" />
    <canvas v-else ref="canvasRef" class="absolute inset-0 h-full w-full" :style="{ imageRendering: 'pixelated', mixBlendMode: props.mixBlendMode as never }" />
  </div>
</template>
