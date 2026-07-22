<script setup lang="ts">
import { computed, ref } from "vue"
import { rubberband } from "./gesture"
import { cssColor } from "./palette"
import { pixelPrefersReducedMotion } from "./pixel"
import { CONTROL_BUTTON } from "./control"
import { cn } from "./lib"
import type { PixelColor } from "./pixel"

/** Pull-to-confirm — drag the button past the threshold and let go to fire;
 * short pulls spring home. 1:1 tracking, rubber-band past the line, and the
 * border arms with the accent when the release would count. */
const props = withDefaults(
  defineProps<{
    /** Displacement that arms the snap, px. */
    threshold?: number
    axis?: "x" | "y" | "both"
    color?: PixelColor
    disabled?: boolean
    class?: string
  }>(),
  { threshold: 64, axis: "x", color: "green", disabled: false }
)
const emit = defineEmits<{ snap: [] }>()

const dx = ref(0)
const dy = ref(0)
const dragging = ref(false)
let pointerId = -1
let sx = 0
let sy = 0

const dist = computed(() => Math.hypot(dx.value, dy.value))
const armed = computed(() => dist.value >= props.threshold)

function clampAxis(x: number, y: number): [number, number] {
  if (props.axis === "x") return [x, 0]
  if (props.axis === "y") return [0, y]
  return [x, y]
}
function soft(v: number) {
  const limit = props.threshold * 1.5
  return Math.abs(v) > limit ? Math.sign(v) * (limit + rubberband(Math.abs(v) - limit, limit)) : v
}
function down(e: PointerEvent) {
  if (props.disabled) return
  dragging.value = true
  pointerId = e.pointerId
  sx = e.clientX
  sy = e.clientY
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function move(e: PointerEvent) {
  if (!dragging.value || e.pointerId !== pointerId) return
  const [x, y] = clampAxis(e.clientX - sx, e.clientY - sy)
  dx.value = soft(x)
  dy.value = soft(y)
}
function up(e: PointerEvent) {
  if (!dragging.value || e.pointerId !== pointerId) return
  dragging.value = false
  if (armed.value) emit("snap")
  dx.value = 0
  dy.value = 0
}
/** Keyboard path: Enter or Space fires without the pull. */
function key(e: KeyboardEvent) {
  if (props.disabled) return
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    emit("snap")
  }
}
const still = pixelPrefersReducedMotion()
</script>

<template>
  <button
    type="button"
    :disabled="props.disabled"
    :class="
      cn(
        'inline-flex touch-none items-center gap-2 rounded-md border px-3.5 py-2 font-mono text-[12px] select-none',
        CONTROL_BUTTON,
        dragging ? 'cursor-grabbing' : 'cursor-grab',
        armed ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        'bg-card/60',
        props.class
      )
    "
    :style="{
      transform: `translate(${dx}px, ${dy}px)`,
      transition: dragging || still ? 'none' : 'transform 300ms cubic-bezier(0.2, 1.4, 0.4, 1)',
      borderColor: armed ? cssColor(props.color) : 'var(--border)',
    }"
    @pointerdown="down"
    @pointermove="move"
    @pointerup="up"
    @pointercancel="up"
    @keydown="key"
  >
    <span
      aria-hidden="true"
      class="size-1.5 shrink-0 rounded-[1px] transition-colors"
      :style="{ background: armed ? cssColor(props.color) : 'var(--border)' }"
    />
    <slot>Pull to confirm</slot>
    <span v-if="armed" class="sr-only">armed, release to confirm</span>
  </button>
</template>
