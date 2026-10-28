<!-- Generated from ../tailwind/DitherButton.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import type { PixelBloomInput, PixelColor } from "../engine/pixel"
import {
  precompiledSrc,
  renderDitherButton,
  STATIC_DEFAULT_MAX_COLS,
  STATIC_DEFAULT_MAX_ROWS,
  DEFAULT_MAX_COLS,
  DEFAULT_MAX_ROWS,
  type DitherRenderMode,
  type PrecompiledDither,
} from "../engine/precompile"
import { putRasterBuffer, type RasterBuffer } from "../engine/raster"
import * as stylex from "@stylexjs/stylex"

export type ButtonVariant = "gradient" | "dotted" | "hatched" | "solid"
export type { DitherRenderMode, PrecompiledDither }

const styles = stylex.create({
  button: {
    position: "relative",
    isolation: "isolate",
    display: "inline-flex",
    minHeight: "2.5rem",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    paddingInline: "1rem",
    paddingBlock: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--foreground)",
    transitionProperty: { default: "opacity, scale", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    scale: { default: null, ":active": "0.96" },
  },
  textBlack: { color: "#000" },
  img: {
    position: "absolute",
    inset: "0px",
    zIndex: "-10",
    height: "100%",
    width: "100%",
    objectFit: "fill",
  },
  canvas: { position: "absolute", inset: "0px", zIndex: "-10", height: "100%", width: "100%" },
  img2: {
    pointerEvents: "none",
    position: "absolute",
    inset: "0px",
    zIndex: "-10",
    height: "100%",
    width: "100%",
    objectFit: "fill",
  },
  canvas2: {
    pointerEvents: "none",
    position: "absolute",
    inset: "0px",
    zIndex: "-10",
    height: "100%",
    width: "100%",
  },
  grid: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "0.125rem",
  },
  text: { width: "0.25rem", height: "0.25rem", backgroundColor: "currentcolor", opacity: "70%" },
  frame: { position: "relative" },
})
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn, type StyleProp } from "./lib"
import { pixelBloomStyle, pixelPrefersReducedMotion } from "../engine/pixel"
import { kitFromSeed } from "../engine/dither-paint"
import { darkInkOnDark, LABEL_COVERAGE } from "../engine/palette"
import { fillOf } from "../engine/pixel"
import { CONTROL_BUTTON } from "./control"

const props = withDefaults(
  defineProps<{
    color?: PixelColor
    variant?: ButtonVariant
    bloom?: PixelBloomInput
    cell?: number // css px per dither cell — chunkiness
    seed?: number
    type?: "button" | "submit" | "reset"
    loading?: boolean
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    maxCols?: number
    maxRows?: number
  }>(),
  { type: "button", loading: false, disabled: false, renderMode: "live", precompiled: undefined },
)
const s = computed(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
const precompiled = computed(() => precompiledSrc(props.precompiled))
const color = computed<PixelColor>(() => props.color ?? s.value?.hue ?? "blue")
const variant = computed<ButtonVariant>(() => props.variant ?? s.value?.variant ?? "gradient")
// A bright fill takes black ink: white on it would sink under AA. The
// raster stores its colour already scaled by alpha: the band is coverage².
const darkInk = computed(() => darkInkOnDark(fillOf(color.value), LABEL_COVERAGE[variant.value] ** 2))
const bloom = computed<PixelBloomInput>(() => props.bloom ?? (props.seed !== undefined ? props.seed : "off"))
const cell = computed(() => props.cell ?? s.value?.cell ?? 2)

/** Effective resolution caps: static mode auto-uses lower caps unless overridden. */
const effMaxCols = computed(() => {
  if (props.maxCols !== undefined) return props.maxCols
  return props.renderMode === "static" ? STATIC_DEFAULT_MAX_COLS : DEFAULT_MAX_COLS
})
const effMaxRows = computed(() => {
  if (props.maxRows !== undefined) return props.maxRows
  return props.renderMode === "static" ? STATIC_DEFAULT_MAX_ROWS : DEFAULT_MAX_ROWS
})

const buttonRef = ref<HTMLButtonElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const bloomRef = ref<HTMLCanvasElement | null>(null)
const bloomStyle = computed(() => pixelBloomStyle(bloom.value))

let teardown: (() => void) | undefined
let restartToken = 0

function init(): (() => void) | undefined {
  if (precompiled.value) return undefined
  const button = buttonRef.value
  const canvas = canvasRef.value
  const ctx = canvas?.getContext("2d", { willReadFrequently: true })
  if (!button || !canvas || !ctx) return undefined
  const bloomCanvas = bloomRef.value
  const bloomCtx = bloomCanvas?.getContext("2d") ?? null
  const reduce = pixelPrefersReducedMotion()
  const animated = props.renderMode !== "static" && !reduce

  let cols = 0
  let rows = 0
  let intensity = 0
  let target = 0
  let hovered = false
  let raf = 0
  let raster: RasterBuffer | undefined
  let imageData: ImageData | undefined

  const paint = () => {
    raster = renderDitherButton(
      {
        width: cols,
        height: rows,
        color: color.value,
        variant: variant.value,
        cell: 1,
        intensity,
        seed: props.seed,
        maxCols: effMaxCols.value,
        maxRows: effMaxRows.value,
      },
      raster,
    )
    imageData = putRasterBuffer(ctx, raster, imageData)
    if (bloomCanvas && bloomCtx) {
      bloomCtx.clearRect(0, 0, cols, rows)
      bloomCtx.drawImage(canvas, 0, 0)
    }
  }

  const tick = () => {
    const d = target - intensity
    if (Math.abs(d) < 0.01) {
      intensity = target
      paint()
      raf = 0
      return
    }
    intensity += d * 0.16
    paint()
    raf = requestAnimationFrame(tick)
  }

  const setTarget = (t: number) => {
    target = t
    if (reduce) {
      intensity = t
      paint()
    } else if (animated && !raf) {
      raf = requestAnimationFrame(tick)
    }
  }

  const resize = () => {
    const box = button.getBoundingClientRect()
    const cellPx = Math.max(1, cell.value)
    cols = Math.max(4, Math.round(box.width / cellPx))
    rows = Math.max(4, Math.round(box.height / cellPx))
    canvas.width = cols
    canvas.height = rows
    if (bloomCanvas) {
      bloomCanvas.width = cols
      bloomCanvas.height = rows
    }
    paint()
  }
  resize()

  const enter = () => {
    hovered = true
    setTarget(1)
  }
  const leave = () => {
    hovered = false
    setTarget(0)
  }
  const down = () => {
    if (!button.disabled) setTarget(1.5)
  }
  const up = () => setTarget(hovered ? 1 : 0)
  if (animated) {
    button.addEventListener("pointerenter", enter)
    button.addEventListener("pointerleave", leave)
    button.addEventListener("pointerdown", down)
    button.addEventListener("pointerup", up)
    button.addEventListener("pointercancel", up)
  }

  const ro = props.renderMode !== "static" && typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null
  ro?.observe(button)

  return () => {
    if (raf) cancelAnimationFrame(raf)
    button.removeEventListener("pointerenter", enter)
    button.removeEventListener("pointerleave", leave)
    button.removeEventListener("pointerdown", down)
    button.removeEventListener("pointerup", up)
    button.removeEventListener("pointercancel", up)
    ro?.disconnect()
  }
}

function restartRuntime() {
  const token = ++restartToken
  teardown?.()
  teardown = undefined
  if (precompiled.value) return
  // Defer to rAF instead of nextTick — nextTick runs inside Vue's flush
  // queue, so getBoundingClientRect() inside resize() forces synchronous
  // layout. rAF runs after layout, so the read is free.
  requestAnimationFrame(() => {
    if (token !== restartToken || precompiled.value) return
    teardown = init()
  })
}

onMounted(restartRuntime)
watch(
  [
    color,
    variant,
    bloom,
    cell,
    precompiled,
    () => props.renderMode,
    () => props.loading,
    () => props.disabled,
    effMaxCols,
    effMaxRows,
  ],
  restartRuntime,
  { flush: "post" },
)
onBeforeUnmount(() => {
  restartToken += 1
  teardown?.()
})
</script>

<template>
  <button
    ref="buttonRef"
    :type="props.type"
    :disabled="props.loading || props.disabled"
    :aria-busy="props.loading || undefined"
    :class="cn(CONTROL_BUTTON, styles.button, darkInk && styles.textBlack, props.xstyle, props.class)"
  >
    <img
      v-if="precompiled"
      :src="precompiled"
      alt=""
      aria-hidden="true"
      v-bind="stylex.attrs(styles.img)"
      style="image-rendering: pixelated"
    />
    <canvas
      v-else
      ref="canvasRef"
      aria-hidden="true"
      v-bind="stylex.attrs(styles.canvas)"
      style="image-rendering: pixelated"
    />
    <img
      v-if="precompiled && bloomStyle"
      :src="precompiled"
      alt=""
      aria-hidden="true"
      v-bind="stylex.attrs(styles.img2)"
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
      aria-hidden="true"
      v-bind="stylex.attrs(styles.canvas2)"
      :style="{
        filter: bloomStyle.filter,
        opacity: bloomStyle.opacity,
        mixBlendMode: bloomStyle.mixBlendMode,
        imageRendering: bloomStyle.imageRendering,
      }"
    />
    <span v-if="props.loading" aria-hidden="true" v-bind="stylex.attrs(styles.grid)">
      <span v-for="n in 3" :key="n" v-bind="stylex.attrs(styles.text)" />
    </span>
    <span v-bind="stylex.attrs(styles.frame)"><slot /></span>
  </button>
</template>
