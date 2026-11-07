<script lang="ts">
import {
  coolTrail,
  createTrail,
  fitTrail,
  paintTrail,
  scrollTrail,
  trailLift,
  trailTo,
  type TrailParams,
} from "../engine/heat-trail"
export type { TrailParams }
export { paintTrail }
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { fillOf, type PixelColor } from "../engine/pixel"
import type { RasterBuffer } from "../engine/raster"
import { prefersReducedMotion } from "../engine/dither-paint"
import { useDitherBackground } from "../engine/use-dither-background"
import { useDitherMatrix } from "../engine/use-screen"

/** HeatTrail: the pointer prints. Over its box a mouse or a pen lays down the
 * kit's diamond in cells, hot; each cell cools down the ramp and thins out
 * through the thresholds until the ground is still again. It listens on
 * the window, so content over it (a heading, a key) never blocks the hand;
 * a finger scrolls instead, and under reduced motion nothing prints. It
 * paints only while something is cooling. `pinned`: the box is fixed to
 * the viewport over a page that scrolls, and the print scrolls with the
 * page, staying where it was laid. */
const props = withDefaults(
  defineProps<{
    /** The ramp, coolest first, hottest last: a fresh cell takes the last. */
    inks?: PixelColor[]
    /** Seconds a cell takes to cool from fresh to nothing. */
    cool?: number
    /** The diamond's radius in cells. */
    size?: number
    /** Device pixels per cell. */
    cell?: number
    paused?: boolean
    /** Fixed to the viewport over a scrolling page: the print moves with it. */
    pinned?: boolean
    dpr?: number
    mixBlendMode?: string
    seed?: number
    class?: string
  }>(),
  {
    inks: () => ["#2f6fd0", "#a6abb1", "#e4e1d8", "#ff9632"],
    cool: 1.6,
    size: 3,
    cell: 4,
    paused: false,
    pinned: false,
  },
)

const MAX_COLS = 480
const MAX_ROWS = 300

const params = computed<TrailParams>(() => ({ inks: props.inks.map(fillOf), cool: props.cool, size: props.size }))
const matrix = useDitherMatrix(() => props.seed)

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let trail = createTrail(1, 1)
/** Where the pointer went since the last paint, as fractions of the box;
 * null where a stroke ended. */
let pending: ([number, number] | null)[] = []
/** Whether anything is cooling: the surface paints only then. */
const live = ref(false)

function move(e: PointerEvent) {
  if (e.pointerType === "touch" || props.paused || prefersReducedMotion()) return
  const box = wrapRef.value?.getBoundingClientRect()
  if (!box?.width || !box.height) return
  const u = (e.clientX - box.left) / box.width
  const v = (e.clientY - box.top) / box.height
  if (u < 0 || v < 0 || u > 1 || v > 1) {
    if (pending.at(-1) !== null) pending.push(null)
    return
  }
  pending.push([u, v])
  live.value = true
}
const lift = () => pending.push(null)
/** Pinned: how far the page scrolled under the print since the last paint, px. */
let scrolled = 0
let lastY = 0
function scroll() {
  if (props.pinned && live.value) scrolled += scrollY - lastY
  lastY = scrollY
}
onMounted(() => {
  lastY = scrollY
  addEventListener("pointermove", move, { passive: true })
  addEventListener("scroll", scroll, { passive: true })
  document.documentElement.addEventListener("pointerleave", lift)
})
onBeforeUnmount(() => {
  removeEventListener("pointermove", move)
  removeEventListener("scroll", scroll)
  document.documentElement.removeEventListener("pointerleave", lift)
})

useDitherBackground({
  wrapRef,
  canvasRef,
  cell: () => props.cell,
  maxCols: MAX_COLS,
  maxRows: MAX_ROWS,
  dpr: () => props.dpr,
  paused: () => props.paused || !live.value,
  renderMode: () => "live",
  precompiled: () => undefined,
  restart: () => [props.seed, props.dpr, props.cell],
  frameRate: () => 0,
  render: (buffer: RasterBuffer, _clock: number, dt: number) => {
    // the field at the raster's size (a resize lets the old heat go)
    trail = fitTrail(trail, buffer.width, buffer.height)
    // pinned: the print rides the page, whole cells at a time
    const rowPx = (wrapRef.value?.clientHeight ?? 0) / buffer.height
    if (rowPx > 0) {
      const rows = Math.trunc(scrolled / rowPx)
      scrollTrail(trail, rows)
      scrolled -= rows * rowPx
    }
    const p = params.value
    for (const at of pending)
      if (at) trailTo(trail, at[0], at[1], p.size)
      else trailLift(trail)
    pending = []
    live.value = coolTrail(trail, dt, p.cool)
    paintTrail(buffer, trail, p, matrix.value)
  },
})
</script>

<template>
  <div
    ref="wrapRef"
    aria-hidden="true"
    :class="cn('pointer-events-none relative block h-full w-full overflow-hidden', props.class)"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 h-full w-full"
      :style="{ imageRendering: 'pixelated', mixBlendMode: props.mixBlendMode as never }"
    />
  </div>
</template>
