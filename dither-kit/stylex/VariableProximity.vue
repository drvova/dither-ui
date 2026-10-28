<!-- Generated from ../tailwind/VariableProximity.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline" },
})
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn, type StyleProp } from "./lib"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { useInviewLoop } from "../engine/use-inview-loop"

const props = withDefaults(
  defineProps<{
    text?: string
    radius?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { text: "Move the cursor across this line to feel the weight shift", radius: 120 },
)

// Per-character weight ramps with pointer distance — no scale, so nothing
// reflows; good for a whole sentence.
const chars = computed(() => [...props.text])
const root = ref<HTMLElement | null>(null)
let raf = 0
let mx = -1e9
let my = -1e9

function onMove(e: PointerEvent) {
  mx = e.clientX
  my = e.clientY
}
function onLeave() {
  mx = -1e9
  my = -1e9
}
function frame() {
  raf = requestAnimationFrame(frame)
  const kids = root.value?.children
  if (!kids) return
  for (let i = 0; i < kids.length; i++) {
    const el = kids[i] as HTMLElement
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const t = Math.max(0, 1 - Math.hypot(mx - cx, my - cy) / props.radius)
    el.style.fontWeight = String(Math.round(300 + t * 600))
    el.style.opacity = String(0.55 + t * 0.45)
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

onMounted(() => {
  if (pixelPrefersReducedMotion()) return
  window.addEventListener("pointermove", onMove, { passive: true })
  window.addEventListener("pointerleave", onLeave)
})
onBeforeUnmount(() => {
  window.removeEventListener("pointermove", onMove)
  window.removeEventListener("pointerleave", onLeave)
})
useInviewLoop(root, start, stop)
</script>

<!-- A space stays a plain space between the letters' spans, so the line
     breaks between words (never inside one); the letters are the root's
     only element children, which the frame walks. -->
<template>
  <span ref="root" :class="cn(styles.text, props.xstyle, props.class)" :aria-label="props.text">
    <template v-for="(ch, i) in chars" :key="i"
      ><template v-if="ch === ' '">{{ " " }}</template
      ><span v-else aria-hidden="true" class="dither-proximity-char" style="opacity: 0.55">{{ ch }}</span></template
    >
  </span>
</template>

<style scoped>
.dither-proximity-char {
  white-space: pre;
  transition:
    font-weight 120ms linear,
    opacity 120ms linear;
}
</style>
