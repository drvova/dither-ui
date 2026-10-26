<!-- Generated from ../tailwind/SnapButton.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  button: {
    display: "inline-flex",
    touchAction: "none",
    alignItems: "center",
    gap: "0.5rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    paddingInline: "0.875rem",
    paddingBlock: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
  cursorGrabbing: { cursor: "grabbing" },
  cursorGrab: { cursor: "grab" },
  textForeground: { color: "var(--foreground)" },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
  button2: { backgroundColor: "color-mix(in oklab, var(--card) 60%, transparent)" },
  text: {
    width: "0.375rem",
    height: "0.375rem",
    flexShrink: "0",
    borderRadius: "1px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  text2: {
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
import { computed, ref } from "vue"
import { rubberband } from "../engine/gesture"
import { cssColor } from "../engine/palette"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import type { PixelColor } from "../engine/pixel"

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
    xstyle?: StyleProp
  }>(),
  { threshold: 64, axis: "x", color: "green", disabled: false },
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
        styles.button,
        CONTROL_BUTTON,
        dragging ? styles.cursorGrabbing : styles.cursorGrab,
        armed ? styles.textForeground : styles.textMutedForeground,
        styles.button2,
        props.xstyle,
        props.class,
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
      v-bind="stylex.attrs(styles.text)"
      :style="{ background: armed ? cssColor(props.color) : 'var(--border)' }"
    />
    <slot>Pull to confirm</slot>
    <span v-if="armed" v-bind="stylex.attrs(styles.text2)">armed, release to confirm</span>
  </button>
</template>
