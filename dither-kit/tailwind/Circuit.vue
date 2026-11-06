<script lang="ts">
import { paintCircuit, type CircuitParams } from "../engine/circuit"
export type { CircuitParams }
export { paintCircuit }
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn } from "./lib"
import { hexToRgb } from "../engine/palette"
import type { RasterBuffer } from "../engine/raster"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
import { useDitherBackground } from "../engine/use-dither-background"
import { useDitherMatrix } from "../engine/use-screen"

/** Circuit: a board printed through the dither. Chips on a lattice, traces
 * leaving their pins in straight runs with 45 degree jogs to a via or a
 * pad, and signals running every trace in the pulse ink, their tails
 * fading through the thresholds. The seed lays the board out; the signals
 * are a pure function of time. */
const props = withDefaults(
  defineProps<{
    /** The traces, chips and vias. */
    ink?: string
    /** The signals. */
    pulse?: string
    /** How much of the board carries traces, 0-1. */
    density?: number
    /** Cells a second a signal travels. */
    speed?: number
    /** Cells between lattice nodes. */
    pitch?: number
    paused?: boolean
    dpr?: number
    /** Stop-motion cadence in fps (0 = smooth). Steps the field like film and
     * skips paints between boundaries — see timing.ts. */
    frameRate?: number
    mixBlendMode?: string
    seed?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    class?: string
  }>(),
  {
    ink: "#a6abb1",
    pulse: "#ff9632",
    density: 0.6,
    speed: 14,
    pitch: 4,
    paused: false,
    frameRate: 0,
    renderMode: "live",
  },
)

const CELL = 3
const MAX_COLS = 320
const MAX_ROWS = 200

const precompiled = computed(() => precompiledSrc(props.precompiled))
const params = computed<CircuitParams>(() => ({
  ink: hexToRgb(props.ink),
  pulse: hexToRgb(props.pulse),
  density: props.density,
  speed: props.speed,
  pitch: props.pitch,
  seed: props.seed ?? 0,
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
  renderMode: () => props.renderMode,
  precompiled: () => precompiled.value,
  restart: () => [props.seed, props.renderMode, precompiled.value, props.dpr, props.density, props.pitch],
  frameRate: () => props.frameRate,
  render: (buffer: RasterBuffer, clock: number) => paintCircuit(buffer, params.value, clock, matrix.value),
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
