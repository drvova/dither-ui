<script lang="ts">
import type { PixelBloomInput, PixelColor } from "./pixel"
import {
  precompiledSrc,
  renderDitherGradient,
  type DitherRenderMode,
  type GradientDirection,
  type PrecompiledDither,
} from "./precompile"
import { putRasterBuffer } from "./raster"

export type { DitherRenderMode, GradientDirection, PrecompiledDither }
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"
import { pixelBloomStyle } from "./pixel"
import { kitFromSeed } from "./dither-paint"

const props = defineProps<{
  from?: PixelColor
  to?: PixelColor | "transparent"
  direction?: GradientDirection
  cell?: number
  opacity?: number
  bloom?: PixelBloomInput
  seed?: number
  class?: string
  renderMode?: DitherRenderMode
  precompiled?: PrecompiledDither
}>()

const s = computed(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
const effFrom = computed(() => props.from ?? s.value?.hue ?? "blue")
const effTo = computed(() => props.to ?? "transparent")
const effDirection = computed(() => props.direction ?? s.value?.direction ?? "up")
const effCell = computed(() => props.cell ?? s.value?.cell ?? 3)
const effOpacity = computed(() => props.opacity ?? s.value?.opacity ?? 1)
const effBloom = computed(
  () => props.bloom ?? (props.seed !== undefined ? props.seed : "off")
)
const precompiled = computed(() => precompiledSrc(props.precompiled))
const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const bloomRef = ref<HTMLCanvasElement | null>(null)
const bloomStyle = computed(() => pixelBloomStyle(effBloom.value))

let ro: ResizeObserver | null = null
let timer = 0
let restartToken = 0
function paint() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  if (!wrap || !canvas || precompiled.value) return
  const box = wrap.getBoundingClientRect()
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const raster = renderDitherGradient({
    width: box.width,
    height: box.height,
    from: effFrom.value,
    to: effTo.value,
    direction: effDirection.value,
    cell: effCell.value,
    opacity: effOpacity.value,
    seed: props.seed,
  })
  canvas.width = raster.width
  canvas.height = raster.height
  putRasterBuffer(ctx, raster)
  const bloomCtx = bloomRef.value?.getContext("2d")
  if (bloomRef.value && bloomCtx) {
    bloomRef.value.width = raster.width
    bloomRef.value.height = raster.height
    bloomCtx.drawImage(canvas, 0, 0)
  }
}

function stopRuntime() {
  clearTimeout(timer)
  timer = 0
  ro?.disconnect()
  ro = null
}

function startRuntime() {
  const token = ++restartToken
  stopRuntime()
  if (precompiled.value) return
  void nextTick(() => {
    if (token !== restartToken || precompiled.value) return
    timer = window.setTimeout(() => {
      paint()
      if (props.renderMode !== "static" && typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(paint)
        if (wrapRef.value) ro.observe(wrapRef.value)
      }
    })
  })
}

onMounted(startRuntime)
watch(() => [precompiled.value, props.renderMode], startRuntime, { flush: "post" })
watch([effFrom, effTo, effDirection, effCell, effOpacity, effBloom], paint, { flush: "post" })
onBeforeUnmount(() => {
  restartToken += 1
  stopRuntime()
})
</script>

<template>
  <div
    ref="wrapRef"
    aria-hidden="true"
    :class="cn('pointer-events-none absolute inset-0 overflow-hidden', props.class)"
  >
    <img
      v-if="precompiled"
      :src="precompiled"
      alt=""
      class="absolute inset-0 h-full w-full object-fill"
      style="image-rendering: pixelated"
    />
    <canvas
      v-else
      ref="canvasRef"
      class="absolute inset-0 h-full w-full"
      style="image-rendering: pixelated"
    />
    <canvas
      v-if="bloomStyle"
      ref="bloomRef"
      class="absolute inset-0 h-full w-full"
      :style="{
        filter: bloomStyle.filter,
        opacity: bloomStyle.opacity,
        mixBlendMode: bloomStyle.mixBlendMode,
        imageRendering: bloomStyle.imageRendering,
      }"
    />
  </div>
</template>
