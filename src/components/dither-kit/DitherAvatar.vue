<script lang="ts">
import { rgb } from "./palette"
import {
  BAYER4,
  clamp01,
  fnv1a,
  hueFill,
  type PixelBloom,
  pixelPrefersReducedMotion,
  xorshift32,
} from "./pixel"

// 8×8 cells, mirrored across one axis → 32 free pattern bits. With the mirror
// axis bit and 180 hues that's 2^33 × 180 ≈ 1.5 trillion distinct avatars.
const GRID = 8
const CELL_PX = 4 // backing px per cell → a 32×32 canvas, scaled up pixelated

export type AvatarMirror = "auto" | "horizontal" | "vertical"

type AvatarModel = {
  on: boolean[]
  density: number[]
  fill: [number, number, number]
}

function avatarModel(
  name: string,
  hueProp: number | undefined,
  mirrorProp: AvatarMirror
): AvatarModel {
  const rand = xorshift32(fnv1a(name))
  const bits = Array.from({ length: 32 }, () => rand() < 0.5)
  const drawnVertical = rand() < 0.5
  const drawnHue = Math.floor(rand() * 180) * 2
  const halfDensity = Array.from({ length: 32 }, () => 0.55 + rand() * 0.45)

  const vertical =
    mirrorProp === "auto" ? drawnVertical : mirrorProp === "vertical"
  const hue = hueProp ?? drawnHue

  const on = new Array<boolean>(GRID * GRID)
  const density = new Array<number>(GRID * GRID)
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const i = vertical
        ? Math.min(r, GRID - 1 - r) * GRID + c
        : r * (GRID / 2) + Math.min(c, GRID - 1 - c)
      on[r * GRID + c] = bits[i]
      density[r * GRID + c] = halfDensity[i]
    }
  }
  return { on, density, fill: hueFill(hue) }
}

function paintAvatar(
  canvas: HTMLCanvasElement,
  bloomCanvas: HTMLCanvasElement | null,
  model: AvatarModel,
  animate: boolean,
  duration: number
): (() => void) | undefined {
  const ctx = canvas.getContext("2d")
  if (!ctx) return undefined
  const px = GRID * CELL_PX
  canvas.width = px
  canvas.height = px
  const bloomCtx = bloomCanvas?.getContext("2d") ?? null
  if (bloomCanvas) {
    bloomCanvas.width = px
    bloomCanvas.height = px
  }

  const draw = (progress: number) => {
    ctx.clearRect(0, 0, px, px)
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (!model.on[r * GRID + c]) continue
        const start = BAYER4[r % 4][c % 4] * 0.7
        const cellAlpha = clamp01((progress - start) / 0.3)
        if (cellAlpha <= 0) continue
        const density = model.density[r * GRID + c]
        const base = 0.35 + 0.65 * density
        for (let py = 0; py < CELL_PX; py++) {
          for (let pxi = 0; pxi < CELL_PX; pxi++) {
            const gx = c * CELL_PX + pxi
            const gy = r * CELL_PX + py
            const lit = density > BAYER4[gy & 3][gx & 3]
            const alpha = (lit ? base : base * 0.35) * cellAlpha
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
    hue?: number
    mirror?: AvatarMirror
    size?: number
    bloom?: PixelBloom
    animate?: boolean
    animationDuration?: number
    replayToken?: number
    class?: string
  }>(),
  { mirror: "auto", bloom: "off", animate: true, animationDuration: 600, replayToken: 0 }
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
    avatarModel(props.name, props.hue, props.mirror),
    props.animate,
    props.animationDuration
  )
}

onMounted(paint)
watch(
  () => [props.name, props.hue, props.mirror, props.animate, props.animationDuration, props.replayToken, props.bloom],
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
