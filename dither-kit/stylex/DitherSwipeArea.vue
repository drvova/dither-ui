<!-- Generated from ../tailwind/DitherSwipeArea.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: { position: "fixed", zIndex: "40", touchAction: "none" },
  box: { insetInline: "0px", bottom: "0px" },
  insetY0: { insetBlock: "0px", right: "0px" },
  insetY02: { insetBlock: "0px", left: "0px" },
})
</script>

<script setup lang="ts">
import { ref } from "vue"
import { cn } from "./lib"

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
  { side: "right", size: 16, threshold: 24 },
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
    :class="
      cn(styles.layer, props.side === 'bottom' ? styles.box : props.side === 'right' ? styles.insetY0 : styles.insetY02)
    "
    :style="props.side === 'bottom' ? { height: `${props.size}px` } : { width: `${props.size}px` }"
    @pointerdown="onDown"
    @pointermove="onMove"
  />
</template>
