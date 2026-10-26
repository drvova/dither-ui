<!-- Generated from ../tailwind/MagnetLines.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", overflow: "hidden" },
  canvas: { pointerEvents: "none", position: "absolute", inset: "0px", height: "100%", width: "100%" },
})
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    color?: string
    gap?: number
    lineLength?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { color: "#7CFF67", gap: 28, lineLength: 14 },
)

const wrap = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
let ro: ResizeObserver | null = null
let W = 1
let H = 1
const m = { x: 0.5, y: 0.5 }

function draw() {
  const c = canvas.value
  const ctx = c?.getContext("2d")
  if (!c || !ctx) return
  ctx.clearRect(0, 0, W, H)
  ctx.strokeStyle = props.color
  ctx.lineWidth = 2
  const half = props.lineLength / 2
  for (let y = props.gap / 2; y < H; y += props.gap) {
    for (let x = props.gap / 2; x < W; x += props.gap) {
      const a = Math.atan2(m.y - y, m.x - x)
      const dx = Math.cos(a) * half
      const dy = Math.sin(a) * half
      ctx.beginPath()
      ctx.moveTo(x - dx, y - dy)
      ctx.lineTo(x + dx, y + dy)
      ctx.stroke()
    }
  }
}
function resize() {
  const c = canvas.value
  const w = wrap.value
  if (!c || !w) return
  const r = w.getBoundingClientRect()
  W = c.width = Math.max(1, r.width)
  H = c.height = Math.max(1, r.height)
  if (m.x <= 1) {
    m.x = W / 2
    m.y = H / 2
  }
  draw()
}
function onMove(e: PointerEvent) {
  const r = wrap.value?.getBoundingClientRect()
  if (!r) return
  m.x = e.clientX - r.left
  m.y = e.clientY - r.top
  draw()
}

onMounted(() => {
  resize()
  ro = new ResizeObserver(() => resize())
  if (wrap.value) ro.observe(wrap.value)
})
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div ref="wrap" :class="cn(styles.frame, props.xstyle, props.class)" @pointermove="onMove">
    <slot />
    <canvas ref="canvas" v-bind="stylex.attrs(styles.canvas)" aria-hidden="true" />
  </div>
</template>
