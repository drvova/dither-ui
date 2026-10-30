<!-- Generated from ../tailwind/LiquidEther.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import { paintLiquidEther, type LiquidEtherParams } from "../engine/liquid-ether"
import * as stylex from "@stylexjs/stylex"

export type { LiquidEtherParams }
export { paintLiquidEther }

const styles = stylex.create({
  frame: { position: "relative", display: "block", height: "100%", width: "100%", overflow: "hidden" },
  img: { position: "absolute", inset: "0px", height: "100%", width: "100%", objectFit: "fill" },
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
})
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
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
    scale?: number
    speed?: number
    flow?: number
    opacity?: number
    dither?: number | boolean
    mouseInteraction?: boolean
    mouseStrength?: number
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
    colors: () => ["#5227FF", "#7CFF67", "#3DA5FF"],
    scale: 2,
    speed: 0.5,
    flow: 1,
    opacity: 1,
    dither: 1,
    mouseInteraction: true,
    mouseStrength: 1,
    paused: false,
    frameRate: 0,
    renderMode: "live",
  },
)

const CELL = 4
const MAX_COLS = 240
const MAX_ROWS = 150

const precompiled = computed(() => precompiledSrc(props.precompiled))
const params = computed<LiquidEtherParams>(() => ({
  colors: (props.colors.length ? props.colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
  scale: props.scale,
  speed: props.speed,
  flow: props.flow,
  opacity: clamp01(props.opacity),
  dither: props.dither === true ? 1 : props.dither === false ? 0 : clamp01(props.dither),
  mouseStrength: props.mouseStrength,
}))
const matrix = useDitherMatrix(() => props.seed)
const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const mouse = { x: 0.5, y: 0.5 }

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
  render: (buffer: RasterBuffer, clock: number) =>
    paintLiquidEther(buffer, params.value, clock, matrix.value, props.mouseInteraction ? mouse : null),
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
