<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    color?: string
    size?: number
    lag?: number
    class?: string
  }>(),
  { color: "#7CFF67", size: 48, lag: 0.18 }
)

const area = ref<HTMLElement | null>(null)
const blob = ref<HTMLElement | null>(null)
let raf = 0
const m = { x: 0, y: 0, active: false }
const p = { x: 0, y: 0 }

function onMove(e: PointerEvent) {
  const r = area.value?.getBoundingClientRect()
  if (!r) return
  m.x = e.clientX - r.left
  m.y = e.clientY - r.top
  m.active = true
}
function frame() {
  raf = requestAnimationFrame(frame)
  const b = blob.value
  if (!b) return
  p.x += (m.x - p.x) * props.lag
  p.y += (m.y - p.y) * props.lag
  b.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${m.active ? 1 : 0})`
}

onMounted(() => {
  if (pixelPrefersReducedMotion()) return
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <div
    ref="area"
    :class="cn('relative overflow-hidden', props.class)"
    @pointermove="onMove"
    @pointerleave="m.active = false"
  >
    <slot />
    <div
      ref="blob"
      class="pointer-events-none absolute left-0 top-0 rounded-full blur-md"
      :style="{ width: `${props.size}px`, height: `${props.size}px`, background: props.color, mixBlendMode: 'screen', transform: 'scale(0)' }"
      aria-hidden="true"
    />
  </div>
</template>
