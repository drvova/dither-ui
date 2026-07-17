<script lang="ts">
import type { PixelBloomInput, PixelColor } from "./pixel"
import {
  precompiledSrc,
  renderDitherGradient,
  STATIC_DEFAULT_MAX_COLS,
  STATIC_DEFAULT_MAX_ROWS,
  DEFAULT_MAX_COLS,
  DEFAULT_MAX_ROWS,
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

const props = withDefaults(
  defineProps<{
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
    maxCols?: number
    maxRows?: number
  }>(),
  { renderMode: "live", precompiled: undefined }
)

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

/** Effective resolution caps: static mode auto-uses lower caps unless overridden. */
const effMaxCols = computed(() => {
  if (props.maxCols !== undefined) return props.maxCols
  return props.renderMode === "static" ? STATIC_DEFAULT_MAX_COLS : DEFAULT_MAX_COLS
})
const effMaxRows = computed(() => {
  if (props.maxRows !== undefined) return props.maxRows
  return props.renderMode === "static" ? STATIC_DEFAULT_MAX_ROWS : DEFAULT_MAX_ROWS
})
const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const bloomRef = ref<HTMLCanvasElement | null>(null)
const bloomStyle = computed(() => pixelBloomStyle(effBloom.value))

let ro: ResizeObserver | null = null
let timer = 0
let idleHandle = 0
let restartToken = 0
let imageData: ImageData | undefined
function paint() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  if (!wrap || !canvas || precompiled.value) return
  const box = wrap.getBoundingClientRect()
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
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
    maxCols: effMaxCols.value,
    maxRows: effMaxRows.value,
  })
  canvas.width = raster.width
  canvas.height = raster.height
  imageData = putRasterBuffer(ctx, raster, imageData)
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
  if (idleHandle) {
    if (typeof cancelIdleCallback === "function") cancelIdleCallback(idleHandle)
    idleHandle = 0
  }
  ro?.disconnect()
  ro = null
}

function startRuntime() {
  const token = ++restartToken
  stopRuntime()
  if (precompiled.value) return
  void nextTick(() => {
    if (token !== restartToken || precompiled.value) return
    if (props.renderMode === "static") {
      // Defer decorative paint to idle so it never blocks first contentful paint.
      // timeout ensures the callback fires even under heavy load (W3C spec).
      // Safari fallback: setTimeout(0) when requestIdleCallback is unavailable.
      if (typeof requestIdleCallback === "function") {
        idleHandle = requestIdleCallback(() => {
          idleHandle = 0
          if (token !== restartToken || precompiled.value) return
          paint()
        }, { timeout: 2000 })
      } else {
        timer = window.setTimeout(() => {
          if (token !== restartToken || precompiled.value) return
          paint()
        })
      }
    } else {
      // Live mode: paint immediately — interactive surfaces need to appear instantly.
      timer = window.setTimeout(() => {
        paint()
        if (typeof ResizeObserver !== "undefined") {
          ro = new ResizeObserver(paint)
          if (wrapRef.value) ro.observe(wrapRef.value)
        }
      })
    }
  })
}

onMounted(startRuntime)
watch(() => [precompiled.value, props.renderMode], startRuntime, { flush: "post" })
watch([effFrom, effTo, effDirection, effCell, effOpacity, effBloom, effMaxCols, effMaxRows], paint, { flush: "post" })
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
    <img
      v-if="precompiled && bloomStyle"
      :src="precompiled"
      alt=""
      class="absolute inset-0 h-full w-full object-fill"
      :style="{
        filter: bloomStyle.filter,
        opacity: bloomStyle.opacity,
        mixBlendMode: bloomStyle.mixBlendMode,
        imageRendering: bloomStyle.imageRendering,
      }"
    />
    <canvas
      v-else-if="bloomStyle"
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
