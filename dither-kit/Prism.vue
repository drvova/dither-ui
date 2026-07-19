<script lang="ts">
import { paintPrism, type PrismParams } from "./prism"
export type { PrismParams }
export { paintPrism }
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn } from "./lib"
import { BAYER4, clamp01, pixelMatrixFromSeed } from "./pixel"
import type { RasterBuffer } from "./raster"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "./precompile"
import { useDitherBackground } from "./use-dither-background"

const props = withDefaults(
  defineProps<{
    spread?: number
    speed?: number
    saturation?: number
    brightness?: number
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
    spread: 0.6,
    speed: 0.5,
    saturation: 0.9,
    brightness: 1,
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
const params = computed<PrismParams>(() => ({
  spread: props.spread,
  speed: props.speed,
  saturation: props.saturation,
  brightness: props.brightness,
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
  render: (buffer: RasterBuffer, clock: number) => paintPrism(buffer, params.value, clock, matrix.value),
})
</script>

<template>
  <div ref="wrapRef" aria-hidden="true" :class="cn('relative block h-full w-full overflow-hidden', props.class)">
    <img v-if="precompiled" :src="precompiled" alt="" class="absolute inset-0 h-full w-full object-fill" :style="{ imageRendering: 'pixelated', mixBlendMode: props.mixBlendMode as never }" />
    <canvas v-else ref="canvasRef" class="absolute inset-0 h-full w-full" :style="{ imageRendering: 'pixelated', mixBlendMode: props.mixBlendMode as never }" />
  </div>
</template>
