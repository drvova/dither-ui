<script lang="ts">
import { paintPoster, posterLayout, type PosterLayout, type PosterParams, type PosterTile } from "../engine/poster"
export type { PosterLayout, PosterParams, PosterTile }
export { paintPoster, posterLayout }
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn } from "./lib"
import { fillOf, type PixelColor, type ScreenKind } from "../engine/pixel"
import type { RasterBuffer } from "../engine/raster"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
import { useDitherBackground } from "../engine/use-dither-background"
import { useScreen } from "../engine/use-screen"

const props = withDefaults(
  defineProps<{
    /** The inks the tiles are printed in. */
    inks?: PixelColor[]
    /** What a tile's open screen cells show where it has no second ink: a colour, or the page beneath. */
    ground?: PixelColor | "transparent"
    /** The screen every tone prints through; default the screen of a `DitherScreen` around it, else Bayer. */
    screen?: ScreenKind
    seed?: number
    /** How fast the screen slides inside the mark, in cells per second. */
    speed?: number
    /** Cell size in CSS px. */
    cell?: number
    paused?: boolean
    frameRate?: number
    dpr?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    class?: string
  }>(),
  {
    inks: () => ["blue", "orange", "grey"],
    ground: "transparent",
    seed: 7,
    speed: 2,
    cell: 2,
    paused: false,
    frameRate: 0,
    renderMode: "live",
  },
)

const around = useScreen()
const precompiled = computed(() => precompiledSrc(props.precompiled))
const layout = computed(() => posterLayout(props.seed, Math.max(1, props.inks.length)))
const params = computed<PosterParams>(() => ({
  inks: (props.inks.length ? props.inks : ["grey"]).map(fillOf),
  ground: props.ground === "transparent" ? null : fillOf(props.ground),
  screen: props.screen ?? around?.value ?? "bayer",
  speed: props.speed,
}))
const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

useDitherBackground({
  wrapRef,
  canvasRef,
  cell: () => props.cell,
  maxCols: 480,
  maxRows: 360,
  dpr: () => props.dpr,
  paused: () => props.paused,
  frameRate: () => props.frameRate,
  renderMode: () => props.renderMode,
  precompiled: () => precompiled.value,
  restart: () => [props.seed, props.renderMode, precompiled.value, props.dpr, props.cell, params.value],
  render: (buffer: RasterBuffer, clock: number) => paintPoster(buffer, layout.value, params.value, clock),
})
</script>

<template>
  <div ref="wrapRef" aria-hidden="true" :class="cn('relative block h-full w-full overflow-hidden', props.class)">
    <img
      v-if="precompiled"
      :src="precompiled"
      alt=""
      class="absolute inset-0 h-full w-full object-fill"
      :style="{ imageRendering: 'pixelated' }"
    />
    <canvas v-else ref="canvasRef" class="absolute inset-0 h-full w-full" :style="{ imageRendering: 'pixelated' }" />
  </div>
</template>
