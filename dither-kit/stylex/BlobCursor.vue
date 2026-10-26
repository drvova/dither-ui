<!-- Generated from ../tailwind/BlobCursor.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", overflow: "hidden" },
  layer: {
    pointerEvents: "none",
    position: "absolute",
    top: "0px",
    left: "0px",
    borderRadius: "calc(infinity * 1px)",
    filter: "blur(12px)        ",
  },
})
</script>

<script setup lang="ts">
import { ref } from "vue"
import { cn, type StyleProp } from "./lib"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { useInviewLoop } from "../engine/use-inview-loop"

const props = withDefaults(
  defineProps<{
    color?: string
    size?: number
    lag?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { color: "#7CFF67", size: 48, lag: 0.18 },
)

const area = ref<HTMLElement | null>(null)
const blob = ref<HTMLElement | null>(null)
let raf = 0
const m = { x: 0, y: 0, active: false }
const p = { x: 0, y: 0 }

function onMove(e: PointerEvent) {
  const r = area.value?.getBoundingClientRect()
  if (!r) return
  m.x = e.clientX - r.left
  m.y = e.clientY - r.top
  m.active = true
}
function frame() {
  raf = requestAnimationFrame(frame)
  const b = blob.value
  if (!b) return
  p.x += (m.x - p.x) * props.lag
  p.y += (m.y - p.y) * props.lag
  b.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${m.active ? 1 : 0})`
}

function start() {
  if (raf || pixelPrefersReducedMotion()) return
  raf = requestAnimationFrame(frame)
}
function stop() {
  if (!raf) return
  cancelAnimationFrame(raf)
  raf = 0
}

useInviewLoop(area, start, stop)
</script>

<template>
  <div
    ref="area"
    :class="cn(styles.frame, props.xstyle, props.class)"
    @pointermove="onMove"
    @pointerleave="m.active = false"
  >
    <slot />
    <div
      ref="blob"
      v-bind="stylex.attrs(styles.layer)"
      :style="{
        width: `${props.size}px`,
        height: `${props.size}px`,
        background: props.color,
        mixBlendMode: 'screen',
        transform: 'scale(0)',
      }"
      aria-hidden="true"
    />
  </div>
</template>
