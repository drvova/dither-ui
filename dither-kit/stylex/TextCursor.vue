<!-- Generated from ../tailwind/TextCursor.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", height: "100%", width: "100%", overflow: "hidden" },
  layer: {
    pointerEvents: "none",
    position: "absolute",
    top: "0px",
    left: "0px",
    fontFamily: "var(--font-mono)",
    transitionProperty: "opacity",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn, type StyleProp } from "./lib"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { useInviewLoop } from "../engine/use-inview-loop"

const props = withDefaults(
  defineProps<{
    text?: string
    class?: string
    xstyle?: StyleProp
  }>(),
  { text: "dither" },
)

const chars = computed(() => [...props.text])
const area = ref<HTMLElement | null>(null)
const trail = ref<HTMLElement | null>(null)
let raf = 0
const mouse = { x: 0, y: 0, active: false }
const pos = chars.value.map(() => ({ x: 0, y: 0 }))

function onMove(e: PointerEvent) {
  const r = area.value?.getBoundingClientRect()
  if (!r) return
  mouse.x = e.clientX - r.left
  mouse.y = e.clientY - r.top
  mouse.active = true
}
function frame() {
  raf = requestAnimationFrame(frame)
  const kids = trail.value?.children
  if (!kids) return
  let tx = mouse.x
  let ty = mouse.y
  for (let i = 0; i < pos.length; i++) {
    pos[i].x += (tx - pos[i].x) * 0.35
    pos[i].y += (ty - pos[i].y) * 0.35
    const el = kids[i] as HTMLElement
    el.style.transform = `translate(${pos[i].x}px, ${pos[i].y}px) translate(-50%, -50%)`
    el.style.opacity = mouse.active ? String(1 - i / (pos.length + 1)) : "0"
    tx = pos[i].x
    ty = pos[i].y
  }
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
    :aria-label="props.text"
    @pointermove="onMove"
    @pointerleave="mouse.active = false"
  >
    <div ref="trail" aria-hidden="true">
      <span v-for="(ch, i) in chars" :key="i" v-bind="stylex.attrs(styles.layer)" style="opacity: 0">{{
        ch === " " ? "\u00a0" : ch
      }}</span>
    </div>
  </div>
</template>
