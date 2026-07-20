<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    color?: string
    count?: number
    size?: number
    class?: string
  }>(),
  { color: "#7CFF67", count: 18, size: 10 }
)

const wrap = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const pts: { x: number; y: number }[] = []
let raf = 0
let ro: ResizeObserver | null = null
const m = { x: 0, y: 0, active: false }

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
  m.x = e.clientX - r.left
  m.y = e.clientY - r.top
  m.active = true
}
function frame() {
  raf = requestAnimationFrame(frame)
  const c = canvas.value
  const ctx = c?.getContext("2d")
  if (!c || !ctx) return
  const head = pts[0] || { x: m.x, y: m.y }
  pts.unshift({ x: head.x + (m.x - head.x) * 0.5, y: head.y + (m.y - head.y) * 0.5 })
  if (pts.length > props.count) pts.pop()
  ctx.clearRect(0, 0, c.width, c.height)
  if (!m.active) return
  ctx.fillStyle = props.color
  for (let i = 0; i < pts.length; i++) {
    const a = 1 - i / pts.length
    ctx.globalAlpha = a * 0.8
    ctx.beginPath()
    ctx.arc(pts[i].x, pts[i].y, props.size * a, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

onMounted(() => {
  resize()
  ro = new ResizeObserver(resize)
  if (wrap.value) ro.observe(wrap.value)
  if (!pixelPrefersReducedMotion()) raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  ro?.disconnect()
})
</script>

<template>
  <div
    ref="wrap"
    :class="cn('relative overflow-hidden', props.class)"
    @pointermove="onMove"
    @pointerleave="m.active = false"
  >
    <slot />
    <canvas ref="canvas" class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
  </div>
</template>
