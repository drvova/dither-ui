<script setup lang="ts">
import { ref } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    color?: string
    size?: number
    class?: string
  }>(),
  { color: "#7CFF67", size: 36 }
)

const area = ref<HTMLElement | null>(null)
const x = ref(-99)
const y = ref(-99)
const on = ref(false)

function onMove(e: PointerEvent) {
  const r = area.value?.getBoundingClientRect()
  if (!r) return
  x.value = e.clientX - r.left
  y.value = e.clientY - r.top
  on.value = true
}
</script>

<template>
  <div
    ref="area"
    :class="cn('relative overflow-hidden', props.class)"
    @pointermove="onMove"
    @pointerleave="on = false"
  >
    <slot />
    <div
      class="dither-target pointer-events-none absolute left-0 top-0"
      :style="{ width: `${props.size}px`, height: `${props.size}px`, transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`, opacity: on ? 1 : 0, color: props.color }"
      aria-hidden="true"
    >
      <span class="corner tl" />
      <span class="corner tr" />
      <span class="corner bl" />
      <span class="corner br" />
    </div>
  </div>
</template>

<style scoped>
.dither-target {
  animation: dither-target-spin 6s linear infinite;
}
.corner {
  position: absolute;
  width: 30%;
  height: 30%;
  border: 2px solid currentColor;
}
.tl {
  top: 0;
  left: 0;
  border-right: 0;
  border-bottom: 0;
}
.tr {
  top: 0;
  right: 0;
  border-left: 0;
  border-bottom: 0;
}
.bl {
  bottom: 0;
  left: 0;
  border-right: 0;
  border-top: 0;
}
.br {
  bottom: 0;
  right: 0;
  border-left: 0;
  border-top: 0;
}
@keyframes dither-target-spin {
  to {
    rotate: 360deg;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dither-target {
    animation: none;
  }
}
</style>
