<script setup lang="ts">
import { computed, onBeforeUnmount } from "vue"
import { cn } from "./lib"

/** Rotary knob: drag VERTICALLY to change the value (the reliable gesture —
 * angle-following wraps badly at the detent), keyboard arrows/PageUp-Down/
 * Home-End, `role="slider"` semantics. Indicator line rotates across a 270°
 * sweep from -135°. */
const props = withDefaults(
  defineProps<{
    modelValue?: number
    min?: number
    max?: number
    step?: number
    size?: number
    disabled?: boolean
    class?: string
  }>(),
  { modelValue: 50, min: 0, max: 100, step: 1, size: 72, disabled: false },
)
const emit = defineEmits<{ (e: "update:modelValue", value: number): void }>()

function clampSnap(next: number): number {
  const snapped = Math.round(next / props.step) * props.step
  return Math.min(props.max, Math.max(props.min, snapped))
}

const ratio = computed(() => {
  const span = props.max - props.min
  return span === 0 ? 0 : (props.modelValue - props.min) / span
})
const angle = computed(() => -135 + ratio.value * 270)

let startY = 0
let startVal = 0
let dragging = false

function onPointerDown(e: PointerEvent) {
  if (props.disabled || e.button !== 0) return
  dragging = true
  startY = e.clientY
  startVal = props.modelValue
  window.addEventListener("pointermove", onPointerMove)
  window.addEventListener("pointerup", stopDrag)
  window.addEventListener("pointercancel", stopDrag)
}
function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  const span = props.max - props.min
  const perPx = span / 160 // full sweep ≈ 160px of drag
  emit("update:modelValue", clampSnap(startVal + (startY - e.clientY) * perPx))
}
function stopDrag() {
  dragging = false
  window.removeEventListener("pointermove", onPointerMove)
  window.removeEventListener("pointerup", stopDrag)
  window.removeEventListener("pointercancel", stopDrag)
}
onBeforeUnmount(stopDrag)

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  const big = props.step * 10
  let next: number | null = null
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = props.modelValue - props.step
  else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = props.modelValue + props.step
  else if (e.key === "PageDown") next = props.modelValue - big
  else if (e.key === "PageUp") next = props.modelValue + big
  else if (e.key === "Home") next = props.min
  else if (e.key === "End") next = props.max
  if (next === null) return
  e.preventDefault()
  emit("update:modelValue", clampSnap(next))
}
</script>

<template>
  <div class="grid justify-items-center gap-1.5" :class="cn(props.class)">
    <div
      role="slider"
      tabindex="0"
      :aria-label="'Knob'"
      :aria-valuemin="props.min"
      :aria-valuemax="props.max"
      :aria-valuenow="props.modelValue"
      :aria-disabled="props.disabled || undefined"
      :style="{ width: `${props.size}px`, height: `${props.size}px` }"
      class="relative cursor-ns-resize rounded-full border border-border bg-card/80 outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none"
      :class="props.disabled && 'pointer-events-none opacity-40'"
      @pointerdown.prevent="onPointerDown"
      @keydown="onKeydown"
    >
      <!-- track arc marker -->
      <span
        class="absolute left-1/2 top-1/2 block h-[calc(50%-4px)] w-0.5 origin-bottom -translate-x-1/2 rounded-full bg-accent"
        :style="{ transform: `translate(-50%, -100%) rotate(${angle}deg)`, transformOrigin: 'bottom center' }"
      />
      <span class="absolute inset-1.5 rounded-full border border-border/60 bg-background/60" />
    </div>
    <span class="text-[11px] tabular-nums text-muted-foreground">{{ props.modelValue }}</span>
  </div>
</template>
