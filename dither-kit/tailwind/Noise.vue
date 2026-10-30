<script lang="ts">
import { paintNoiseField, type NoiseParams } from "../engine/noise-field"
export type { NoiseParams }
export { paintNoiseField }
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn } from "./lib"
import { clamp01 } from "../engine/pixel"
import { hexToRgb } from "../engine/palette"
import type { RasterBuffer } from "../engine/raster"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
import { useDitherBackground } from "../engine/use-dither-background"
import { useDitherMatrix } from "../engine/use-screen"

const props = withDefaults(
  defineProps<{
    colors?: string[]
    speed?: number
    density?: number
    opacity?: number
    paused?: boolean
    frameRate?: number
    dpr?: number
    mixBlendMode?: string
    seed?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    class?: string
  }>(),
  {
    colors: () => ["#3DA5FF", "#7CE0FF", "#FFFFFF"],
    speed: 1,
    density: 0.5,
    opacity: 1,
    paused: false,
    frameRate: 0,
    renderMode: "live",
  },
)

const CELL = 3
const MAX_COLS = 300
const MAX_ROWS = 190

const precompiled = computed(() => precompiledSrc(props.precompiled))
const params = computed<NoiseParams>(() => ({
  colors: (props.colors.length ? props.colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
  speed: props.speed,
  density: clamp01(props.density),
  opacity: clamp01(props.opacity),
}))
const matrix = useDitherMatrix(() => props.seed)
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
  frameRate: () => props.frameRate,
  renderMode: () => props.renderMode,
  precompiled: () => precompiled.value,
  restart: () => [props.seed, props.renderMode, precompiled.value, props.dpr],
  render: (buffer: RasterBuffer, clock: number) => paintNoiseField(buffer, params.value, clock, matrix.value),
})
</script>

<template>
  <div ref="wrapRef" aria-hidden="true" :class="cn('relative block h-full w-full overflow-hidden', props.class)">
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
