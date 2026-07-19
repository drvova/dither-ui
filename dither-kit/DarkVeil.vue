<script lang="ts">
import { paintDarkVeil, type DarkVeilParams } from "./dark-veil"
export type { DarkVeilParams }
export { paintDarkVeil }
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
    scale?: number
    speed?: number
    intensity?: number
    vignette?: number
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
    colors: () => ["#0A0A12", "#3A2A6A", "#5227FF"],
    scale: 3,
    speed: 0.4,
    intensity: 2.5,
    vignette: 0.7,
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
const params = computed<DarkVeilParams>(() => ({
  colors: (props.colors.length ? props.colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
  scale: props.scale,
  speed: props.speed,
  intensity: props.intensity,
  vignette: props.vignette,
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
  render: (buffer: RasterBuffer, clock: number) => paintDarkVeil(buffer, params.value, clock, matrix.value),
})
</script>

<template>
  <div ref="wrapRef" aria-hidden="true" :class="cn('relative block h-full w-full overflow-hidden', props.class)">
    <img v-if="precompiled" :src="precompiled" alt="" class="absolute inset-0 h-full w-full object-fill" :style="{ imageRendering: 'pixelated', mixBlendMode: props.mixBlendMode as never }" />
    <canvas v-else ref="canvasRef" class="absolute inset-0 h-full w-full" :style="{ imageRendering: 'pixelated', mixBlendMode: props.mixBlendMode as never }" />
  </div>
</template>
