<!-- Generated from ../tailwind/RippleGrid.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import { paintRippleGrid, type RippleGridParams } from "../engine/ripple-grid"
import * as stylex from "@stylexjs/stylex"

export type { RippleGridParams }
export { paintRippleGrid }

const styles = stylex.create({
  frame: { position: "relative", display: "block", height: "100%", width: "100%", overflow: "hidden" },
  img: { position: "absolute", inset: "0px", height: "100%", width: "100%", objectFit: "fill" },
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn, type StyleProp } from "./lib"
import { BAYER4, clamp01, pixelMatrixFromSeed } from "../engine/pixel"
import { hexToRgb } from "../engine/palette"
import type { RasterBuffer } from "../engine/raster"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
import { useDitherBackground } from "../engine/use-dither-background"

const props = withDefaults(
  defineProps<{
    colors?: string[]
    gap?: number
    dotSize?: number
    frequency?: number
    speed?: number
    glow?: number
    opacity?: number
    dither?: number | boolean
    paused?: boolean
    frameRate?: number
    dpr?: number
    mixBlendMode?: string
    seed?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    class?: string
    xstyle?: StyleProp
  }>(),
  {
    colors: () => ["#3DA5FF", "#7CE0FF", "#CFF6FF"],
    gap: 26,
    dotSize: 0.6,
    frequency: 26,
    speed: 0.5,
    glow: 1.5,
    opacity: 1,
    dither: 1,
    paused: false,
    frameRate: 0,
    renderMode: "live",
  },
)

const CELL = 3
const MAX_COLS = 260
const MAX_ROWS = 170

const precompiled = computed(() => precompiledSrc(props.precompiled))
const params = computed<RippleGridParams>(() => ({
  colors: (props.colors.length ? props.colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
  gap: props.gap,
  dotSize: props.dotSize,
  frequency: props.frequency,
  speed: props.speed,
  glow: props.glow,
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
  frameRate: () => props.frameRate,
  renderMode: () => props.renderMode,
  precompiled: () => precompiled.value,
  restart: () => [props.seed, props.renderMode, precompiled.value, props.dpr],
  render: (buffer: RasterBuffer, clock: number) => paintRippleGrid(buffer, params.value, clock, matrix.value),
})
</script>

<template>
  <div ref="wrapRef" aria-hidden="true" :class="cn(styles.frame, props.xstyle, props.class)">
    <img
      v-if="precompiled"
      :src="precompiled"
      alt=""
      v-bind="stylex.attrs(styles.img)"
      :style="{ imageRendering: 'pixelated', mixBlendMode: props.mixBlendMode as never }"
    />
    <canvas
      v-else
      ref="canvasRef"
      v-bind="stylex.attrs(styles.canvas)"
      :style="{ imageRendering: 'pixelated', mixBlendMode: props.mixBlendMode as never }"
    />
  </div>
</template>
