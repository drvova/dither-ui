<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    text?: string
    class?: string
  }>(),
  { text: "dither" }
)

const chars = computed(() => [...props.text])
const area = ref<HTMLElement | null>(null)
const trail = ref<HTMLElement | null>(null)
let raf = 0
const mouse = { x: 0, y: 0, active: false }
const pos = chars.value.map(() => ({ x: 0, y: 0 }))

function onMove(e: PointerEvent) {
  const r = area.value?.getBoundingClientRect()
  if (!r) return
  mouse.x = e.clientX - r.left
  mouse.y = e.clientY - r.top
  mouse.active = true
}
function frame() {
  raf = requestAnimationFrame(frame)
  const kids = trail.value?.children
  if (!kids) return
  let tx = mouse.x
  let ty = mouse.y
  for (let i = 0; i < pos.length; i++) {
    pos[i].x += (tx - pos[i].x) * 0.35
    pos[i].y += (ty - pos[i].y) * 0.35
    const el = kids[i] as HTMLElement
    el.style.transform = `translate(${pos[i].x}px, ${pos[i].y}px) translate(-50%, -50%)`
    el.style.opacity = mouse.active ? String(1 - i / (pos.length + 1)) : "0"
    tx = pos[i].x
    ty = pos[i].y
  }
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
    :class="cn('relative h-full w-full overflow-hidden', props.class)"
    :aria-label="props.text"
    @pointermove="onMove"
    @pointerleave="mouse.active = false"
  >
    <div ref="trail" aria-hidden="true">
      <span
        v-for="(ch, i) in chars"
        :key="i"
        class="pointer-events-none absolute left-0 top-0 font-mono transition-opacity duration-200"
        style="opacity: 0"
      >{{ ch === " " ? "\u00a0" : ch }}</span>
    </div>
  </div>
</template>
