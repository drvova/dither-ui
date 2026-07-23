<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue"
import { cssColor } from "./palette"
import { CONTROL_BUTTON } from "./control"
import { cn } from "./lib"
import type { PixelColor } from "./pixel"

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
  }>(),
  { duration: 1200, direction: "vertical", color: "orange", disabled: false }
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
    :class="
      cn(
        'relative touch-none overflow-hidden rounded-md border border-border/60 bg-card/60 px-4 py-2.5 font-mono text-[12px] text-muted-foreground transition-colors select-none hover:text-foreground',
        CONTROL_BUTTON,
        (holding || done) && 'text-foreground',
        props.class
      )
    "
    @pointerdown.prevent="start"
    @pointerup="release"
    @pointerleave="release"
    @pointercancel="release"
    @keydown="keydown"
    @keyup="keyup"
  >
    <span
      aria-hidden="true"
      class="absolute"
      :class="props.direction === 'vertical' ? 'inset-x-0 bottom-0' : 'inset-y-0 left-0'"
      :style="props.direction === 'vertical' ? { height: `${progress * 100}%` } : { width: `${progress * 100}%` }"
    >
      <span class="absolute inset-0 opacity-20" :style="{ background: cssColor(props.color) }" />
      <span
        class="absolute"
        :class="props.direction === 'vertical' ? 'inset-x-0 top-0 h-[3px]' : 'inset-y-0 left-full w-[3px] -translate-x-full'"
        :style="{
          backgroundImage: `radial-gradient(circle, ${cssColor(props.color)} 1.2px, transparent 1.2px)`,
          backgroundSize: props.direction === 'vertical' ? '5px 3px' : '3px 5px',
        }"
      />
    </span>
    <span class="relative">
      <slot>Hold to confirm</slot>
      <template v-if="done"> ✓</template>
    </span>
    <span v-if="done" class="sr-only" role="status">completed</span>
  </button>
</template>
