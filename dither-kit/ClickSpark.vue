<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    color?: string
    count?: number
    size?: number
    duration?: number
    class?: string
  }>(),
  { color: "#7CFF67", count: 8, size: 16, duration: 420 }
)

const wrap = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
type Spark = { x: number; y: number; t0: number }
let sparks: Spark[] = []
let raf = 0
let ro: ResizeObserver | null = null

function resize() {
  const c = canvas.value
  const w = wrap.value
  if (!c || !w) return
  const r = w.getBoundingClientRect()
  c.width = Math.max(1, r.width)
  c.height = Math.max(1, r.height)
}
function onClick(e: MouseEvent) {
  if (pixelPrefersReducedMotion()) return
  const w = wrap.value
  if (!w) return
  const r = w.getBoundingClientRect()
  sparks.push({ x: e.clientX - r.left, y: e.clientY - r.top, t0: performance.now() })
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
  sparks = sparks.filter((s) => now - s.t0 < props.duration)
  ctx.strokeStyle = props.color
  ctx.lineWidth = 2
  for (const s of sparks) {
    const p = (now - s.t0) / props.duration
    const r0 = props.size * p
    const len = props.size * (1 - p) * 0.7
    ctx.globalAlpha = 1 - p
    for (let i = 0; i < props.count; i++) {
      const a = (i / props.count) * Math.PI * 2
      const x0 = s.x + Math.cos(a) * r0
      const y0 = s.y + Math.sin(a) * r0
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x0 + Math.cos(a) * len, y0 + Math.sin(a) * len)
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
  raf = sparks.length ? requestAnimationFrame(frame) : 0
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
  <div ref="wrap" :class="cn('relative', props.class)" @click="onClick">
    <slot />
    <canvas ref="canvas" class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
  </div>
</template>
