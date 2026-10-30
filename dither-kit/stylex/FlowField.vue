<!-- Generated from ../tailwind/FlowField.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import { paintFlowField, fadeRasterAlpha, type FlowFieldParams } from "../engine/flow-field"
import * as stylex from "@stylexjs/stylex"

export type { FlowFieldParams }
export { paintFlowField, fadeRasterAlpha }

const styles = stylex.create({
  frame: { position: "relative", display: "block", height: "100%", width: "100%", overflow: "hidden" },
  img: { position: "absolute", inset: "0px", height: "100%", width: "100%", objectFit: "fill" },
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn, type StyleProp } from "./lib"
import { clamp01 } from "../engine/pixel"
import { hexToRgb } from "../engine/palette"
import type { RasterBuffer } from "../engine/raster"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
import { useDitherBackground } from "../engine/use-dither-background"
import { useDitherMatrix } from "../engine/use-screen"

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
    xstyle?: StyleProp
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
  },
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
const matrix = useDitherMatrix(() => props.seed)
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
  render: (buffer: RasterBuffer, clock: number, dt: number, elapsed: number) =>
    paintFlowField(buffer, params.value, clock, dt, matrix.value, elapsed),
})
</script>

<template>
  <div
    ref="wrapRef"
    aria-hidden="true"
    :class="cn(styles.frame, props.xstyle, props.class)"
    :style="{
      maskImage: MASKS[props.mask],
      WebkitMaskImage: MASKS[props.mask],
      mixBlendMode: props.mixBlendMode as never,
    }"
  >
    <img
      v-if="precompiled"
      :src="precompiled"
      alt=""
      v-bind="stylex.attrs(styles.img)"
      :style="{ imageRendering: 'pixelated' }"
    />
    <canvas v-else ref="canvasRef" v-bind="stylex.attrs(styles.canvas)" :style="{ imageRendering: 'pixelated' }" />
  </div>
</template>
