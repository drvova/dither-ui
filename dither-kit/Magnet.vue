<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    strength?: number
    radius?: number
    class?: string
  }>(),
  { strength: 0.4, radius: 200 }
)

const el = ref<HTMLElement | null>(null)
const inner = ref<HTMLElement | null>(null)
let onMove: ((e: PointerEvent) => void) | null = null

onMounted(() => {
  if (pixelPrefersReducedMotion()) return
  onMove = (e) => {
    const box = el.value?.getBoundingClientRect()
    const it = inner.value
    if (!box || !it) return
    const dx = e.clientX - (box.left + box.width / 2)
    const dy = e.clientY - (box.top + box.height / 2)
    if (Math.hypot(dx, dy) < props.radius) {
      it.style.transform = `translate(${dx * props.strength}px, ${dy * props.strength}px)`
    } else {
      it.style.transform = "translate(0, 0)"
    }
  }
  window.addEventListener("pointermove", onMove, { passive: true })
})
onBeforeUnmount(() => {
  if (onMove) window.removeEventListener("pointermove", onMove)
})
</script>

<template>
  <div ref="el" :class="cn('inline-block', props.class)">
    <div ref="inner" class="dither-magnet-inner">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.dither-magnet-inner {
  transition: transform 300ms cubic-bezier(0.2, 0, 0, 1);
  will-change: transform;
}
@media (prefers-reduced-motion: reduce) {
  .dither-magnet-inner {
    transition: none;
  }
}
</style>
