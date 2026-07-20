<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    color?: string
    gap?: number
    class?: string
  }>(),
  { color: "#7CFF67", gap: 24 }
)

const wrap = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const lit = new Map<string, number>()
const LIFE = 650
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
function onMove(e: PointerEvent) {
  const r = wrap.value?.getBoundingClientRect()
  if (!r) return
  const cx = Math.floor((e.clientX - r.left) / props.gap)
  const cy = Math.floor((e.clientY - r.top) / props.gap)
  lit.set(`${cx},${cy}`, performance.now())
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
  ctx.fillStyle = props.color
  const s = props.gap * 0.7
  for (const [k, t] of lit) {
    const age = now - t
    if (age > LIFE) {
      lit.delete(k)
      continue
    }
    const [cx, cy] = k.split(",").map(Number)
    ctx.globalAlpha = 1 - age / LIFE
    ctx.fillRect(cx * props.gap + (props.gap - s) / 2, cy * props.gap + (props.gap - s) / 2, s, s)
  }
  ctx.globalAlpha = 1
  raf = lit.size ? requestAnimationFrame(frame) : 0
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
