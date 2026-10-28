<!-- Generated from ../tailwind/ScrollProgress.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  fixed: { position: "fixed", insetInline: "0px", zIndex: "50" },
  sticky: { position: "sticky", zIndex: "10", marginBottom: "-0.25rem" },
  bottom0: { bottom: "0px" },
  top0: { top: "0px" },
  progress: { height: "0.25rem", width: "100%" },
})
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import DitherProgress from "./DitherProgress.vue"
import { cn, type StyleProp } from "./lib"
import type { PixelColor } from "../engine/pixel"

/** Reading progress — a dithered bar riding the viewport edge (or the top of
 * a positioned parent), fed by rAF-throttled scroll. It composes
 * DitherProgress: one progress painter, everywhere. */
const props = withDefaults(
  defineProps<{
    /** viewport pins to the window edge; parent tracks the nearest scrollable ancestor. */
    attach?: "viewport" | "parent"
    edge?: "top" | "bottom"
    color?: PixelColor
    class?: string
    xstyle?: StyleProp
  }>(),
  { attach: "viewport", edge: "top", color: "green" },
)

const value = ref(0)
const host = ref<HTMLDivElement | null>(null)
let raf = 0
let scroller: HTMLElement | Window = window

function measure() {
  raf = 0
  if (scroller instanceof Window) {
    const doc = document.documentElement
    const max = doc.scrollHeight - doc.clientHeight
    value.value = max > 0 ? Math.round((doc.scrollTop / max) * 100) : 0
  } else {
    const max = scroller.scrollHeight - scroller.clientHeight
    value.value = max > 0 ? Math.round((scroller.scrollTop / max) * 100) : 0
  }
}
function onScroll() {
  if (!raf) raf = requestAnimationFrame(measure)
}

onMounted(() => {
  if (props.attach === "parent") {
    let p = host.value?.parentElement ?? null
    while (p) {
      const o = getComputedStyle(p).overflowY
      if (o === "auto" || o === "scroll") break
      p = p.parentElement
    }
    if (p) scroller = p
  }
  scroller.addEventListener("scroll", onScroll, { passive: true })
  measure()
})
onBeforeUnmount(() => {
  scroller.removeEventListener("scroll", onScroll)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <div
    ref="host"
    role="presentation"
    :class="
      cn(
        props.attach === 'viewport' ? styles.fixed : styles.sticky,
        props.edge === 'bottom' ? styles.bottom0 : styles.top0,
        props.xstyle,
        props.class,
      )
    "
  >
    <DitherProgress :value="value" :color="props.color" :xstyle="styles.progress" />
  </div>
</template>
