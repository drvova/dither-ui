<!-- Generated from ../tailwind/HoldAction.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  button: {
    position: "relative",
    touchAction: "none",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 60%, transparent)",
    paddingInline: "1rem",
    paddingBlock: "0.625rem",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
  textForeground: { color: "var(--foreground)" },
  layer: { position: "absolute" },
  text: { insetInline: "0px", bottom: "0px" },
  text2: { insetBlock: "0px", left: "0px" },
  layer2: { position: "absolute", inset: "0px", opacity: "20%" },
  text3: { insetInline: "0px", top: "0px", height: "3px" },
  text4: { insetBlock: "0px", left: "100%", width: "3px", translate: "-100% 0" },
  frame: { position: "relative" },
  text5: {
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
import { onBeforeUnmount, ref } from "vue"
import { cssColor } from "../engine/palette"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import type { PixelColor } from "../engine/pixel"

/** Hold-to-complete — press and hold while a liquid fill with a dotted crest
 * rises (or slides) toward full; release early and it drains back. Works with
 * pointer or a held Enter/Space; completion fires exactly once per fill. */
const props = withDefaults(
  defineProps<{
    /** Hold time to complete, ms. */
    duration?: number
    direction?: "vertical" | "horizontal"
    color?: PixelColor
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { duration: 1200, direction: "vertical", color: "orange", disabled: false },
)
const emit = defineEmits<{ complete: [] }>()

const progress = ref(0)
const holding = ref(false)
const done = ref(false)
let raf = 0
let dir = 0
let last = 0
let resetTimer: ReturnType<typeof setTimeout> | undefined

function tick(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  const rate = dir > 0 ? 1000 / props.duration : -1000 / (props.duration * 0.35)
  progress.value = Math.max(0, Math.min(1, progress.value + rate * dt))
  if (dir > 0 && progress.value >= 1) {
    holding.value = false
    done.value = true
    emit("complete")
    resetTimer = setTimeout(() => {
      done.value = false
      progress.value = 0
    }, 900)
    return
  }
  if (dir < 0 && progress.value <= 0) return
  raf = requestAnimationFrame(tick)
}
function start() {
  if (props.disabled || done.value || holding.value) return
  holding.value = true
  dir = 1
  last = performance.now()
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(tick)
}
function release() {
  if (!holding.value) return
  holding.value = false
  dir = -1
  last = performance.now()
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(tick)
}
function keydown(e: KeyboardEvent) {
  if (e.repeat) return
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    start()
  }
}
function keyup(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === " ") release()
}
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  clearTimeout(resetTimer)
})
</script>

<template>
  <button
    type="button"
    :disabled="props.disabled"
    :class="cn(styles.button, CONTROL_BUTTON, (holding || done) && styles.textForeground, props.xstyle, props.class)"
    @pointerdown.prevent="start"
    @pointerup="release"
    @pointerleave="release"
    @pointercancel="release"
    @keydown="keydown"
    @keyup="keyup"
  >
    <span
      aria-hidden="true"
      :class="cn(styles.layer, props.direction === 'vertical' ? styles.text : styles.text2)"
      :style="props.direction === 'vertical' ? { height: `${progress * 100}%` } : { width: `${progress * 100}%` }"
    >
      <span v-bind="stylex.attrs(styles.layer2)" :style="{ background: cssColor(props.color) }" />
      <span
        :class="cn(styles.layer, props.direction === 'vertical' ? styles.text3 : styles.text4)"
        :style="{
          backgroundImage: `radial-gradient(circle, ${cssColor(props.color)} 1.2px, transparent 1.2px)`,
          backgroundSize: props.direction === 'vertical' ? '5px 3px' : '3px 5px',
        }"
      />
    </span>
    <span v-bind="stylex.attrs(styles.frame)">
      <slot>Hold to confirm</slot>
      <template v-if="done"> ✓</template>
    </span>
    <span v-if="done" v-bind="stylex.attrs(styles.text5)" role="status">completed</span>
  </button>
</template>
