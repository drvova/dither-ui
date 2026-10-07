<script setup lang="ts">
import { computed, onBeforeUnmount } from "vue"
import { cn } from "./lib"
import DitherInput from "./DitherInput.vue"
import Icon from "./Icon.vue"

/** Drag-to-scrub numeric field (the Figma-style gesture): the grip is a real
 * `role="slider"` — arrow keys, PageUp/Down and Home/End work without a
 * pointer, and the read-only input stays selectable for copying. Values snap
 * to `step`; float noise is trimmed by the step's own precision. */
const props = withDefaults(
  defineProps<{
    modelValue?: number
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    class?: string
  }>(),
  { modelValue: 0, min: 0, max: 100, step: 1, disabled: false },
)
const emit = defineEmits<{ (e: "update:modelValue", value: number): void }>()

const decimals = computed(() => {
  const s = String(props.step)
  return s.includes(".") ? s.split(".")[1].length : 0
})
const display = computed(() =>
  Number.isInteger(props.modelValue)
    ? String(props.modelValue)
    : props.modelValue.toFixed(decimals.value),
)
const ariaValueText = computed(() => display.value)

function clampSnap(next: number): number {
  const snapped = Math.round(next / props.step) * props.step
  const rounded = Number(snapped.toFixed(decimals.value))
  return Math.min(props.max, Math.max(props.min, rounded))
}

let startX = 0
let startVal = 0
let dragging = false

function onPointerDown(e: PointerEvent) {
  if (props.disabled || e.button !== 0) return
  dragging = true
  startX = e.clientX
  startVal = props.modelValue
  window.addEventListener("pointermove", onPointerMove)
  window.addEventListener("pointerup", onPointerUp)
  window.addEventListener("pointercancel", onPointerUp)
}
function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  emit("update:modelValue", clampSnap(startVal + (e.clientX - startX) * props.step))
}
function onPointerUp() {
  dragging = false
  window.removeEventListener("pointermove", onPointerMove)
  window.removeEventListener("pointerup", onPointerUp)
  window.removeEventListener("pointercancel", onPointerUp)
}
onBeforeUnmount(onPointerUp)

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
  <div class="flex items-stretch gap-1" :class="cn(props.class)">
    <DitherInput
      v-bind="$attrs"
      readonly
      :model-value="display"
      :disabled="props.disabled"
      class="flex-1 cursor-ew-resize text-right tabular-nums"
    />
    <button
      type="button"
      role="slider"
      aria-label="Scrub value"
      :aria-valuemin="props.min"
      :aria-valuemax="props.max"
      :aria-valuenow="props.modelValue"
      :aria-valuetext="ariaValueText"
      :aria-disabled="props.disabled"
      :disabled="props.disabled"
      class="grid w-7 shrink-0 cursor-ew-resize place-items-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
      @pointerdown.prevent="onPointerDown"
      @keydown="onKeydown"
    >
      <Icon name="GripVertical" :size="14" />
    </button>
  </div>
</template>
