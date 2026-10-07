<script setup lang="ts">
import { ref } from "vue"
import { cn } from "./lib"
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
  <div class="grid gap-2" :class="cn(props.class)">
    <canvas
      ref="canvasEl"
      :width="props.width"
      :height="props.height"
      :aria-label="props.placeholder"
      role="img"
      class="w-full cursor-crosshair touch-none rounded-md border border-border bg-background/60 outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      :class="props.disabled && 'pointer-events-none opacity-40'"
      @pointerdown.prevent="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="strokeEnd"
      @pointerleave="strokeEnd"
      @pointercancel="strokeEnd"
    />
    <DitherButton variant="solid" size="sm" class="justify-self-start" :disabled="props.disabled" @click="clear">
      Clear
    </DitherButton>
  </div>
</template>
