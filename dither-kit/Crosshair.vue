<script setup lang="ts">
import { ref } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    color?: string
    thickness?: number
    class?: string
  }>(),
  { color: "#7CFF67", thickness: 1 }
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
      class="pointer-events-none absolute inset-y-0"
      :style="{ left: `${x}px`, width: `${props.thickness}px`, background: props.color, opacity: on ? 0.8 : 0 }"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-x-0"
      :style="{ top: `${y}px`, height: `${props.thickness}px`, background: props.color, opacity: on ? 0.8 : 0 }"
      aria-hidden="true"
    />
  </div>
</template>
