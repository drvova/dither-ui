<script setup lang="ts">
import { ref } from "vue"

/** Invisible edge strip that opens a drawer on a directional swipe —
 * swipe inward from the edge the drawer lives on. */
const props = withDefaults(
  defineProps<{
    /** Which edge the drawer slides in from. */
    side?: "right" | "left" | "bottom"
    /** Strip thickness in px. */
    size?: number
    /** Swipe distance in px that commits the open. */
    threshold?: number
    disabled?: boolean
  }>(),
  { side: "right", size: 16, threshold: 24 }
)
const emit = defineEmits<{ open: [] }>()

const fired = ref(false)
let start = 0

const pos = (e: PointerEvent) => (props.side === "bottom" ? e.clientY : e.clientX)
// Inward direction: from the right edge a leftward swipe (-x) opens, etc.
const inwardSign = () => (props.side === "left" ? 1 : -1)

function onDown(e: PointerEvent) {
  if (props.disabled) return
  fired.value = false
  start = pos(e)
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function onMove(e: PointerEvent) {
  if (props.disabled || fired.value) return
  if ((pos(e) - start) * inwardSign() > props.threshold) {
    fired.value = true
    emit("open")
  }
}
</script>

<template>
  <div
    aria-hidden="true"
    class="fixed z-40 touch-none"
    :class="
      props.side === 'bottom'
        ? 'inset-x-0 bottom-0'
        : props.side === 'right'
          ? 'inset-y-0 right-0'
          : 'inset-y-0 left-0'
    "
    :style="props.side === 'bottom' ? { height: `${props.size}px` } : { width: `${props.size}px` }"
    @pointerdown="onDown"
    @pointermove="onMove"
  />
</template>
