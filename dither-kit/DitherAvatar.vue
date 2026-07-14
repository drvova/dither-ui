<script lang="ts">
import { rgb } from "./palette"
import {
  BAYER4,
  clamp01,
  fillOf,
  fnv1a,
  hueFill,
  type PixelBloomInput,
  type PixelColor,
  pixelPrefersReducedMotion,
  xorshift32,
} from "./pixel"

// Defaults: 8×8 cells mirrored across one axis → 32 free pattern bits. With
// the mirror axis bit and 180 hues that's ≈ 1.5 trillion distinct avatars.
// Both are now props — `grid` (even, 4–16) and `cellPx` drive the resolution.

export type AvatarMirror = "auto" | "horizontal" | "vertical"

type AvatarModel = {
  grid: number
  on: boolean[]
  density: number[]
  fill: [number, number, number]
}

function avatarModel(
  name: string,
  colorProp: PixelColor | undefined,
  mirrorProp: AvatarMirror,
  gridProp: number
): AvatarModel {
  const grid = Math.max(4, Math.min(16, Math.round(gridProp / 2) * 2))
  const half = (grid * grid) / 2
  const rand = xorshift32(fnv1a(name))
  const bits = Array.from({ length: half }, () => rand() < 0.5)
  const drawnVertical = rand() < 0.5
  const drawnHue = Math.floor(rand() * 180) * 2
  const halfDensity = Array.from({ length: half }, () => 0.55 + rand() * 0.45)

  const vertical =
    mirrorProp === "auto" ? drawnVertical : mirrorProp === "vertical"
  const fill = colorProp != null ? fillOf(colorProp) : hueFill(drawnHue)

  const on = new Array<boolean>(grid * grid)
  const density = new Array<number>(grid * grid)
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const i = vertical
        ? Math.min(r, grid - 1 - r) * grid + c
        : r * (grid / 2) + Math.min(c, grid - 1 - c)
      on[r * grid + c] = bits[i]
      density[r * grid + c] = halfDensity[i]
    }
  }
  return { grid, on, density, fill }
}

type PaintOpts = {
  animate: boolean
  duration: number
  cellPx: number
  boost: number // additive per-cell density bias
  offTier: number // alpha tier of unlit backing pixels
}

function paintAvatar(
  canvas: HTMLCanvasElement,
  bloomCanvas: HTMLCanvasElement | null,
  model: AvatarModel,
  { animate, duration, cellPx, boost, offTier }: PaintOpts
): (() => void) | undefined {
  const ctx = canvas.getContext("2d")
  if (!ctx) return undefined
  const grid = model.grid
  const cp = Math.max(1, Math.round(cellPx))
  const px = grid * cp
  canvas.width = px
  canvas.height = px
  const bloomCtx = bloomCanvas?.getContext("2d") ?? null
  if (bloomCanvas) {
    bloomCanvas.width = px
    bloomCanvas.height = px
  }

  const draw = (progress: number) => {
    ctx.clearRect(0, 0, px, px)
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        if (!model.on[r * grid + c]) continue
        const start = BAYER4[r % 4][c % 4] * 0.7
        const cellAlpha = clamp01((progress - start) / 0.3)
        if (cellAlpha <= 0) continue
        const density = clamp01(model.density[r * grid + c] + boost)
        const base = 0.35 + 0.65 * density
        for (let py = 0; py < cp; py++) {
          for (let pxi = 0; pxi < cp; pxi++) {
            const gx = c * cp + pxi
            const gy = r * cp + py
            const lit = density > BAYER4[gy & 3][gx & 3]
            const alpha = (lit ? base : base * offTier) * cellAlpha
            ctx.fillStyle = rgb(model.fill, 1, alpha)
            ctx.fillRect(gx, gy, 1, 1)
          }
        }
      }
    }
    if (bloomCtx) {
      bloomCtx.clearRect(0, 0, px, px)
      bloomCtx.drawImage(canvas, 0, 0)
    }
  }

  if (!animate || pixelPrefersReducedMotion()) {
    draw(1)
    return undefined
  }

  let raf = 0
  const startTime = performance.now()
  const tick = (now: number) => {
    const t = clamp01((now - startTime) / duration)
    draw(1 - (1 - t) ** 3)
    if (t < 1) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"
import { pixelBloomStyle } from "./pixel"

const props = withDefaults(
  defineProps<{
    name: string
    /** Colour override — palette name, hue number, or hex. Derived from the
     * name when omitted (or when the legacy `hue` prop is set). */
    color?: PixelColor
    hue?: number
    mirror?: AvatarMirror
    size?: number
    grid?: number // even cell count per side (4–16)
    cellPx?: number // backing px per cell — dither resolution inside a cell
    density?: number // additive density bias (-0.5–0.5)
    offTier?: number // 0–1 alpha of unlit backing pixels
    bloom?: PixelBloomInput
    animate?: boolean
    animationDuration?: number
    replayToken?: number
    class?: string
  }>(),
  {
    mirror: "auto",
    grid: 8,
    cellPx: 4,
    density: 0,
    offTier: 0.35,
    bloom: "off",
    animate: true,
    animationDuration: 600,
    replayToken: 0,
  }
)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const bloomRef = ref<HTMLCanvasElement | null>(null)
const bloomStyle = computed(() => pixelBloomStyle(props.bloom))

let teardown: (() => void) | undefined
function paint() {
  teardown?.()
  const canvas = canvasRef.value
  if (!canvas) return
  teardown = paintAvatar(
    canvas,
    bloomRef.value,
    avatarModel(props.name, props.color ?? props.hue, props.mirror, props.grid),
    {
      animate: props.animate,
      duration: props.animationDuration,
      cellPx: props.cellPx,
      boost: props.density,
      offTier: props.offTier,
    }
  )
}

onMounted(paint)
watch(
  () => [
    props.name, props.color, props.hue, props.mirror, props.grid, props.cellPx,
    props.density, props.offTier, props.animate, props.animationDuration,
    props.replayToken, props.bloom,
  ],
  paint
)
onBeforeUnmount(() => teardown?.())
</script>

<template>
  <div
    role="img"
    :aria-label="`${props.name} avatar`"
    :class="cn('relative', props.class)"
    :style="props.size != null ? { width: `${props.size}px`, height: `${props.size}px` } : undefined"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 h-full w-full"
      style="image-rendering: pixelated"
    />
    <canvas
      v-if="bloomStyle"
      ref="bloomRef"
      class="pointer-events-none absolute inset-0 h-full w-full"
      :style="{
        filter: bloomStyle.filter,
        opacity: bloomStyle.opacity,
        mixBlendMode: bloomStyle.mixBlendMode,
        imageRendering: bloomStyle.imageRendering,
      }"
    />
  </div>
</template>
