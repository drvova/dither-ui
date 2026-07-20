<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    colors?: string[]
    size?: number
    duration?: number
    class?: string
  }>(),
  { colors: () => ["#5227FF", "#7CFF67", "#3DA5FF", "#FF3D2E", "#FFD23D"], size: 40, duration: 650 }
)

const wrap = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
type Tile = { x: number; y: number; t0: number; color: string; rot: number }
let tiles: Tile[] = []
let raf = 0
let ro: ResizeObserver | null = null
let last = { x: 0, y: 0 }
let ci = 0

function resize() {
  const c = canvas.value
  const w = wrap.value
  if (!c || !w) return
  const r = w.getBoundingClientRect()
  c.width = Math.max(1, r.width)
  c.height = Math.max(1, r.height)
}
function onMove(e: PointerEvent) {
  const r = wrap.value?.getBoundingClientRect()
  if (!r) return
  const x = e.clientX - r.left
  const y = e.clientY - r.top
  if (Math.hypot(x - last.x, y - last.y) < props.size * 0.6) return
  last = { x, y }
  const palette = props.colors.length ? props.colors : ["#7CFF67"]
  tiles.push({ x, y, t0: performance.now(), color: palette[ci % palette.length], rot: (Math.random() - 0.5) * 0.6 })
  ci++
  if (!raf) raf = requestAnimationFrame(frame)
}
function frame(now: number) {
  const c = canvas.value
  const ctx = c?.getContext("2d")
  if (!c || !ctx) {
    raf = 0
    return
  }
  ctx.clearRect(0, 0, c.width, c.height)
  tiles = tiles.filter((t) => now - t.t0 < props.duration)
  for (const t of tiles) {
    const p = (now - t.t0) / props.duration
    const s = props.size * (1 - p * 0.4)
    ctx.save()
    ctx.translate(t.x, t.y)
    ctx.rotate(t.rot)
    ctx.globalAlpha = 1 - p
    ctx.fillStyle = t.color
    ctx.fillRect(-s / 2, -s / 2, s, s)
    ctx.restore()
  }
  ctx.globalAlpha = 1
  raf = tiles.length ? requestAnimationFrame(frame) : 0
}

onMounted(() => {
  resize()
  ro = new ResizeObserver(resize)
  if (wrap.value) ro.observe(wrap.value)
})
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  ro?.disconnect()
})
</script>

<template>
  <div ref="wrap" :class="cn('relative overflow-hidden', props.class)" @pointermove="onMove">
    <slot />
    <canvas ref="canvas" class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
  </div>
</template>
