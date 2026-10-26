<!-- Generated from ../tailwind/ScrubInput.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "flex", alignItems: "stretch", gap: "0.25rem" },
  input: { flex: "1", cursor: "ew-resize", textAlign: "right", fontVariantNumeric: "   tabular-nums " },
  button: {
    display: "grid",
    width: "1.75rem",
    flexShrink: "0",
    cursor: "ew-resize",
    placeItems: "center",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
})
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount } from "vue"
import { cn, type StyleProp } from "./lib"
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
    xstyle?: StyleProp
  }>(),
  { modelValue: 0, min: 0, max: 100, step: 1, disabled: false },
)
const emit = defineEmits<{ (e: "update:modelValue", value: number): void }>()

const decimals = computed(() => {
  const s = String(props.step)
  return s.includes(".") ? s.split(".")[1].length : 0
})
const display = computed(() =>
  Number.isInteger(props.modelValue) ? String(props.modelValue) : props.modelValue.toFixed(decimals.value),
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
  <div :class="cn(styles.row, props.xstyle, props.class)">
    <DitherInput v-bind="$attrs" readonly :model-value="display" :disabled="props.disabled" :xstyle="styles.input" />
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
      v-bind="stylex.attrs(styles.button)"
      @pointerdown.prevent="onPointerDown"
      @keydown="onKeydown"
    >
      <Icon name="GripVertical" :size="14" />
    </button>
  </div>
</template>
