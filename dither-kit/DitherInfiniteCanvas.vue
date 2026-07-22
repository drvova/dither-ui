<script setup lang="ts">
import { ref, watch } from "vue"
import { cn } from "./lib"

/** Pannable, zoomable work surface — drag to pan, wheel to zoom toward the
 * cursor, the dotted field rides the same transform so space feels real.
 * Content lives in the default slot at world coordinates. */
const props = withDefaults(
  defineProps<{
    /** Zoom (v-model:zoom). */
    zoom?: number
    minZoom?: number
    maxZoom?: number
    pattern?: "dots" | "grid" | "plain"
    /** Pattern pitch at zoom 1, CSS px. */
    cell?: number
    label?: string
    class?: string
  }>(),
  { zoom: 1, minZoom: 0.25, maxZoom: 3, pattern: "dots", cell: 16, label: "Infinite canvas" }
)
const emit = defineEmits<{ "update:zoom": [number] }>()

const el = ref<HTMLDivElement | null>(null)
const tx = ref(0)
const ty = ref(0)
const z = ref(props.zoom)
watch(
  () => props.zoom,
  (v) => (z.value = Math.min(props.maxZoom, Math.max(props.minZoom, v)))
)

let pointerId = -1
let lastX = 0
let lastY = 0
const panning = ref(false)

function down(e: PointerEvent) {
  if (e.button !== 0) return
  panning.value = true
  pointerId = e.pointerId
  lastX = e.clientX
  lastY = e.clientY
  el.value?.setPointerCapture(e.pointerId)
}
function move(e: PointerEvent) {
  if (!panning.value || e.pointerId !== pointerId) return
  tx.value += e.clientX - lastX
  ty.value += e.clientY - lastY
  lastX = e.clientX
  lastY = e.clientY
}
function up(e: PointerEvent) {
  if (e.pointerId === pointerId) panning.value = false
}
/** Wheel zoom anchored to the cursor: the world point under it stays put. */
function wheel(e: WheelEvent) {
  e.preventDefault()
  const r = el.value?.getBoundingClientRect()
  if (!r) return
  const next = Math.min(props.maxZoom, Math.max(props.minZoom, z.value * Math.exp(-e.deltaY * 0.0015)))
  const k = next / z.value
  const cx = e.clientX - r.left
  const cy = e.clientY - r.top
  tx.value = cx - (cx - tx.value) * k
  ty.value = cy - (cy - ty.value) * k
  z.value = next
  emit("update:zoom", next)
}

const layer = (zoomed: number) => {
  const c = `${props.cell * zoomed}px ${props.cell * zoomed}px`
  if (props.pattern === "dots")
    return { backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)", backgroundSize: c }
  if (props.pattern === "grid")
    return {
      backgroundImage:
        "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
      backgroundSize: c,
    }
  return {}
}
</script>

<template>
  <div
    ref="el"
    role="group"
    :aria-label="props.label"
    :class="cn('relative touch-none overflow-hidden bg-background/40 select-none', panning ? 'cursor-grabbing' : 'cursor-grab', props.class)"
    @pointerdown="down"
    @pointermove="move"
    @pointerup="up"
    @pointercancel="up"
    @wheel="wheel"
  >
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 opacity-40"
      :style="{ ...layer(z), backgroundPosition: `${tx}px ${ty}px` }"
    />
    <div class="absolute top-0 left-0 origin-top-left" :style="{ transform: `translate(${tx}px, ${ty}px) scale(${z})` }">
      <slot />
    </div>
  </div>
</template>
