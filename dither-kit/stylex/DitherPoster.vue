<!-- Generated from ../tailwind/DitherPoster.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import { paintPoster, posterLayout, type PosterBand, type PosterLayout, type PosterParams } from "../engine/poster"
import * as stylex from "@stylexjs/stylex"

export type { PosterBand, PosterLayout, PosterParams }
export { paintPoster, posterLayout }

const styles = stylex.create({
  frame: { position: "relative", display: "block", height: "100%", width: "100%", overflow: "hidden" },
  img: { position: "absolute", inset: "0px", height: "100%", width: "100%", objectFit: "fill" },
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn, type StyleProp } from "./lib"
import { fillOf, type PixelColor, type ScreenKind } from "../engine/pixel"
import type { RasterBuffer } from "../engine/raster"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
import { useDitherBackground } from "../engine/use-dither-background"
import { useScreen } from "../engine/use-screen"

const props = withDefaults(
  defineProps<{
    /** The inks the fields are printed in. */
    inks?: PixelColor[]
    /** What a field's open screen cells show: a colour, or the page beneath. */
    ground?: PixelColor | "transparent"
    /** The disc's screen; default the screen of a `DitherScreen` around it, else diagonal. */
    screen?: ScreenKind
    seed?: number
    /** How fast the hatch slides, in cells per second. */
    speed?: number
    /** Cell size in CSS px. */
    cell?: number
    paused?: boolean
    frameRate?: number
    dpr?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    class?: string
    xstyle?: StyleProp
  }>(),
  {
    inks: () => ["orange", "blue", "green", "pink", "purple"],
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
  screen: props.screen ?? around?.value ?? "diagonal",
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
  <div ref="wrapRef" aria-hidden="true" :class="cn(styles.frame, props.xstyle, props.class)">
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
