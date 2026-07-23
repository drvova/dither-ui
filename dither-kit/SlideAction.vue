<script setup lang="ts">
import { ref } from "vue"
import { project, rubberband, velocityFrom, type VelocitySample } from "./gesture"
import { cssColor } from "./palette"
import { pixelPrefersReducedMotion } from "./pixel"
import { CONTROL_BUTTON } from "./control"
import { cn } from "./lib"
import type { PixelColor } from "./pixel"

/** Slide-to-confirm — drag the thumb to the end of the track (or flick it;
 * momentum projection counts) to fire, release early and it springs back.
 * Enter or Space confirms without the slide. */
const props = withDefaults(
  defineProps<{
    label?: string
    color?: PixelColor
    disabled?: boolean
    class?: string
  }>(),
  { label: "Slide to confirm", color: "green", disabled: false }
)
const emit = defineEmits<{ confirm: [] }>()

const trackRef = ref<HTMLElement | null>(null)
const thumbRef = ref<HTMLButtonElement | null>(null)
const x = ref(0)
const travel = ref(1)
const dragging = ref(false)
const done = ref(false)
const still = pixelPrefersReducedMotion()
let pid = -1
let sx = 0
let samples: VelocitySample[] = []

function measure() {
  const track = trackRef.value
  const thumb = thumbRef.value
  if (track && thumb) travel.value = Math.max(1, track.clientWidth - thumb.offsetWidth - 8)
}
function finish() {
  measure()
  x.value = travel.value
  done.value = true
  emit("confirm")
  setTimeout(() => {
    done.value = false
    x.value = 0
  }, 900)
}
function down(e: PointerEvent) {
  if (props.disabled || done.value) return
  measure()
  dragging.value = true
  pid = e.pointerId
  sx = e.clientX - x.value
  samples = [{ t: e.timeStamp, p: e.clientX }]
  thumbRef.value?.setPointerCapture(e.pointerId)
}
function move(e: PointerEvent) {
  if (!dragging.value || e.pointerId !== pid) return
  const raw = e.clientX - sx
  x.value = raw < 0 ? -rubberband(-raw, 48) : Math.min(raw, travel.value)
  samples.push({ t: e.timeStamp, p: e.clientX })
  if (samples.length > 6) samples.shift()
}
function up(e: PointerEvent) {
  if (!dragging.value || e.pointerId !== pid) return
  dragging.value = false
  if (x.value >= travel.value - 2 || x.value + project(velocityFrom(samples)) >= travel.value) finish()
  else x.value = 0
}
/** Keyboard path: Enter or Space confirms without the slide. */
function key(e: KeyboardEvent) {
  if (props.disabled || done.value) return
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    finish()
  }
}
</script>

<template>
  <div
    ref="trackRef"
    :class="cn('relative flex h-10 w-64 touch-none items-center rounded-full border border-border/60 bg-card/60 px-1 select-none', props.class)"
  >
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-10 text-center font-mono text-[12px] text-muted-foreground"
      :style="{ opacity: x ? Math.max(0, 1 - x / (travel * 0.6)) : 1 }"
    >
      {{ props.label }}
    </span>
    <button
      ref="thumbRef"
      type="button"
      :disabled="props.disabled"
      :aria-label="props.label"
      :class="
        cn(
          'grid size-8 shrink-0 place-items-center rounded-full text-[14px] text-background',
          CONTROL_BUTTON,
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        )
      "
      :style="{
        background: cssColor(props.color),
        transform: `translateX(${x}px)`,
        transition: dragging || still ? 'none' : 'transform 300ms cubic-bezier(0.2, 1.4, 0.4, 1)',
      }"
      @pointerdown="down"
      @pointermove="move"
      @pointerup="up"
      @pointercancel="up"
      @keydown="key"
    >
      {{ done ? "✓" : "→" }}
    </button>
    <span v-if="done" class="sr-only" role="status">confirmed</span>
  </div>
</template>
