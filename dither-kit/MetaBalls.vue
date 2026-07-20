<script lang="ts">
import { paintMetaBalls, type MetaBallsParams } from "./meta-balls"
export type { MetaBallsParams }
export { paintMetaBalls }
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
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
    ballSize?: number
    glow?: number
    opacity?: number
    dither?: number | boolean
    mouseInteraction?: boolean
    paused?: boolean
    dpr?: number
    mixBlendMode?: string
    seed?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    class?: string
  }>(),
  {
    colors: () => ["#5227FF", "#7CFF67", "#3DA5FF"],
    count: 6,
    speed: 1,
    ballSize: 1,
    glow: 1.5,
    opacity: 1,
    dither: 1,
    mouseInteraction: true,
    paused: false,
    renderMode: "live",
  }
)

const CELL = 4
const MAX_COLS = 240
const MAX_ROWS = 150

const precompiled = computed(() => precompiledSrc(props.precompiled))
const params = computed<MetaBallsParams>(() => ({
  colors: (props.colors.length ? props.colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
  count: props.count,
  speed: props.speed,
  ballSize: props.ballSize,
  glow: props.glow,
  opacity: clamp01(props.opacity),
  dither: props.dither === true ? 1 : props.dither === false ? 0 : clamp01(props.dither),
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
  dpr: () => props.dpr,
  paused: () => props.paused,
  renderMode: () => props.renderMode,
  precompiled: () => precompiled.value,
  restart: () => [props.seed, props.renderMode, precompiled.value, props.dpr],
  render: (buffer: RasterBuffer, clock: number) =>
    paintMetaBalls(buffer, params.value, clock, matrix.value, props.mouseInteraction ? mouse : null),
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
  <div ref="wrapRef" aria-hidden="true" :class="cn('relative block h-full w-full overflow-hidden', props.class)">
    <img v-if="precompiled" :src="precompiled" alt="" class="absolute inset-0 h-full w-full object-fill" :style="{ imageRendering: 'pixelated', mixBlendMode: props.mixBlendMode as never }" />
    <canvas v-else ref="canvasRef" class="absolute inset-0 h-full w-full" :style="{ imageRendering: 'pixelated', mixBlendMode: props.mixBlendMode as never }" />
  </div>
</template>
