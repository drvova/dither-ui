<!-- Generated from ../tailwind/SignaturePad.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: { display: "grid", gap: "0.5rem" },
  canvas: {
    width: "100%",
    cursor: "crosshair",
    touchAction: "none",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    outlineStyle: "none",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(2px + 0px) var(--ring)" },
  },
  canvas2: { pointerEvents: "none", opacity: "40%" },
  button: { justifySelf: "flex-start" },
})
</script>

<script setup lang="ts">
import { ref } from "vue"
import { cn, type StyleProp } from "./lib"
import DitherButton from "./DitherButton.vue"

/** Signature pad: pointer drawing on a canvas, `change` fires the dataURL
 * after every stroke (and on clear). Canvas is sized in markup; the drawing
 * context is checked once at mount — a context-less environment (jsdom) keeps
 * the control honest by refusing strokes instead of throwing. */
const props = withDefaults(
  defineProps<{
    width?: number
    height?: number
    placeholder?: string
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { width: 420, height: 160, placeholder: "Sign here", disabled: false },
)
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "change", value: string): void
}>()

const canvasEl = ref<HTMLCanvasElement | null>(null)
const drawing = ref(false)
let hasContext = false

function context(): CanvasRenderingContext2D | null {
  const el = canvasEl.value
  if (!el) return null
  if (!hasContext) {
    hasContext = el.getContext("2d") !== null
    if (!hasContext) return null
  }
  return el.getContext("2d")
}

function localPoint(e: PointerEvent): [number, number] {
  const el = canvasEl.value
  if (!el) return [0, 0]
  const rect = el.getBoundingClientRect()
  return [e.clientX - rect.left, e.clientY - rect.top]
}

function strokeEnd() {
  if (!drawing.value) return
  drawing.value = false
  const el = canvasEl.value
  const data = el ? el.toDataURL("image/png") : ""
  emit("update:modelValue", data)
  emit("change", data)
}

function onPointerDown(e: PointerEvent) {
  if (props.disabled || e.button !== 0) return
  const ctx = context()
  if (!ctx) return
  drawing.value = true
  const [x, y] = localPoint(e)
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + 0.01, y) // a dot for a single-tap stroke
  ctx.strokeStyle = "currentColor"
  ctx.lineWidth = 2
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.stroke()
}

function onPointerMove(e: PointerEvent) {
  if (!drawing.value) return
  const ctx = context()
  if (!ctx) return
  const [x, y] = localPoint(e)
  ctx.lineTo(x, y)
  ctx.stroke()
}

function clear() {
  const el = canvasEl.value
  const ctx = context()
  if (el && ctx) ctx.clearRect(0, 0, el.width, el.height)
  emit("update:modelValue", "")
  emit("change", "")
}
</script>

<template>
  <div :class="cn(styles.grid, props.xstyle, props.class)">
    <canvas
      ref="canvasEl"
      :width="props.width"
      :height="props.height"
      :aria-label="props.placeholder"
      role="img"
      :class="cn(styles.canvas, props.disabled && styles.canvas2)"
      @pointerdown.prevent="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="strokeEnd"
      @pointerleave="strokeEnd"
      @pointercancel="strokeEnd"
    />
    <DitherButton variant="solid" size="sm" :xstyle="styles.button" :disabled="props.disabled" @click="clear">
      Clear
    </DitherButton>
  </div>
</template>
