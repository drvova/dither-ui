<!-- Generated from ../tailwind/Knob.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: { display: "grid", justifyItems: "center", gap: "0.375rem" },
  frame: {
    position: "relative",
    cursor: "ns-resize",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--card) 80%, transparent)",
    outlineStyle: "none",
    boxShadow: {
      default: null,
      ":focus-visible": "0 0 0 calc(2px + 0px) color-mix(in oklab, var(--accent) 50%, transparent)",
    },
    pointerEvents: { default: null, ":disabled": "none" },
  },
  box: { pointerEvents: "none", opacity: "40%" },
  layer: {
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    left: "calc(1 / 2 * 100%)",
    display: "block",
    height: "calc(50% - 4px)",
    width: "0.125rem",
    transformOrigin: "bottom",
    translate: "calc(calc(1 / 2 * 100%) * -1) 0",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "var(--accent)",
  },
  layer2: {
    position: "absolute",
    inset: "0.375rem",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
  },
  text: { fontSize: "11px", color: "var(--muted-foreground)", fontVariantNumeric: "   tabular-nums " },
})
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount } from "vue"
import { cn, type StyleProp } from "./lib"

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
    xstyle?: StyleProp
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
  <div :class="cn(styles.grid, props.xstyle, props.class)">
    <div
      role="slider"
      tabindex="0"
      :aria-label="'Knob'"
      :aria-valuemin="props.min"
      :aria-valuemax="props.max"
      :aria-valuenow="props.modelValue"
      :aria-disabled="props.disabled || undefined"
      :style="{ width: `${props.size}px`, height: `${props.size}px` }"
      :class="cn(styles.frame, props.disabled && styles.box)"
      @pointerdown.prevent="onPointerDown"
      @keydown="onKeydown"
    >
      <!-- track arc marker -->
      <span
        v-bind="stylex.attrs(styles.layer)"
        :style="{ transform: `translate(-50%, -100%) rotate(${angle}deg)`, transformOrigin: 'bottom center' }"
      />
      <span v-bind="stylex.attrs(styles.layer2)" />
    </div>
    <span v-bind="stylex.attrs(styles.text)">{{ props.modelValue }}</span>
  </div>
</template>
