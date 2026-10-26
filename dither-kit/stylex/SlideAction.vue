<!-- Generated from ../tailwind/SlideAction.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    position: "relative",
    display: "flex",
    height: "2.5rem",
    width: "16rem",
    touchAction: "none",
    alignItems: "center",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 60%, transparent)",
    paddingInline: "0.25rem",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
  layer: {
    pointerEvents: "none",
    position: "absolute",
    insetInline: "2.5rem",
    textAlign: "center",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "var(--muted-foreground)",
  },
  button: {
    display: "grid",
    width: "2rem",
    height: "2rem",
    flexShrink: "0",
    placeItems: "center",
    borderRadius: "calc(infinity * 1px)",
    fontSize: "14px",
    color: "var(--background)",
  },
  cursorGrabbing: { cursor: "grabbing" },
  cursorGrab: { cursor: "grab" },
  text: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  },
})
</script>

<script setup lang="ts">
import { ref } from "vue"
import { project, rubberband, velocityFrom, type VelocitySample } from "../engine/gesture"
import { cssColor } from "../engine/palette"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import type { PixelColor } from "../engine/pixel"

/** Slide-to-confirm — drag the thumb to the end of the track (or flick it;
 * momentum projection counts) to fire, release early and it springs back.
 * Enter or Space confirms without the slide. */
const props = withDefaults(
  defineProps<{
    label?: string
    color?: PixelColor
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { label: "Slide to confirm", color: "green", disabled: false },
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
  <div ref="trackRef" :class="cn(styles.row, props.xstyle, props.class)">
    <span
      aria-hidden="true"
      v-bind="stylex.attrs(styles.layer)"
      :style="{ opacity: x ? Math.max(0, 1 - x / (travel * 0.6)) : 1 }"
    >
      {{ props.label }}
    </span>
    <button
      ref="thumbRef"
      type="button"
      :disabled="props.disabled"
      :aria-label="props.label"
      :class="cn(styles.button, CONTROL_BUTTON, dragging ? styles.cursorGrabbing : styles.cursorGrab)"
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
    <span v-if="done" v-bind="stylex.attrs(styles.text)" role="status">confirmed</span>
  </div>
</template>
