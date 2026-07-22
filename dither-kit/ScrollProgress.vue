<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import DitherProgress from "./DitherProgress.vue"
import { cn } from "./lib"
import type { PixelColor } from "./pixel"

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
  }>(),
  { attach: "viewport", edge: "top", color: "green" }
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
        props.attach === 'viewport' ? 'fixed inset-x-0 z-50' : 'sticky z-10 -mb-1',
        props.edge === 'bottom' ? 'bottom-0' : 'top-0',
        props.class
      )
    "
  >
    <DitherProgress :value="value" :color="props.color" class="h-1 w-full" />
  </div>
</template>
