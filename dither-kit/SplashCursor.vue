<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    color?: string
    maxRadius?: number
    duration?: number
    class?: string
  }>(),
  { color: "#3DA5FF", maxRadius: 60, duration: 700 }
)

const wrap = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
type Ripple = { x: number; y: number; t0: number }
let ripples: Ripple[] = []
let raf = 0
let ro: ResizeObserver | null = null
let last = { x: 0, y: 0 }

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
  if (Math.hypot(x - last.x, y - last.y) < 22) return
  last = { x, y }
  ripples.push({ x, y, t0: performance.now() })
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
  ripples = ripples.filter((r) => now - r.t0 < props.duration)
  ctx.strokeStyle = props.color
  for (const r of ripples) {
    const p = (now - r.t0) / props.duration
    ctx.globalAlpha = (1 - p) * 0.7
    ctx.lineWidth = 2 * (1 - p)
    ctx.beginPath()
    ctx.arc(r.x, r.y, p * props.maxRadius, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  raf = ripples.length ? requestAnimationFrame(frame) : 0
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
