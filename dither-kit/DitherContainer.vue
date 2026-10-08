<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { CONTAINER_SCALE, quantize, resolveCq, type CqScale } from "./containers"

const props = withDefaults(
  defineProps<{
    /** Bucket scale in container px — declaration order irrelevant. */
    scale?: CqScale
    /** Quantize `--cq-w` / `--cq-h` to this many px (0 = continuous). */
    step?: number
    /** Native `container-name` for `@container` rules in children's styles. */
    name?: string
    as?: string
    class?: string
  }>(),
  { scale: () => CONTAINER_SCALE, step: 0, name: "dither", as: "div" },
)

const root = ref<HTMLElement | null>(null)
/** 0 until the first observation — the honest pre-measure size. */
const width = ref(0)
const height = ref(0)
let ro: ResizeObserver | null = null
let fallback = 0

function update(w: number, h: number): void {
  const nw = Math.max(0, Math.round(w))
  const nh = Math.max(0, Math.round(h))
  if (width.value !== nw) width.value = nw
  if (height.value !== nh) height.value = nh
}

const state = computed(() => resolveCq(width.value, props.scale))
/** What children receive: the resolution plus the measured content box. */
const slotState = computed(() => ({
  ...state.value,
  width: width.value,
  height: height.value,
}))
/** container-type/name make the node a native query container too — children
 * can use stylesheet `@container <name>` without any of this JS. */
const boxStyle = computed(() => ({
  containerType: "inline-size",
  containerName: props.name,
  "--cq-w": String(props.step > 0 ? quantize(width.value, props.step) : width.value),
  "--cq-h": String(props.step > 0 ? quantize(height.value, props.step) : height.value),
  "--cq-i": String(state.value.index),
}))

onMounted(() => {
  const node = root.value
  if (!node) return
  // contentRect = the content box, i.e. exactly what `@container` measures,
  // and transform-proof (use-chart-dimensions precedent). Without a
  // ResizeObserver the state simply stays at the 0-size bucket.
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      update(
        entry ? entry.contentRect.width : node.clientWidth,
        entry ? entry.contentRect.height : node.clientHeight,
      )
    })
    ro.observe(node)
  }
  // First-paint guard: if nothing reported (silent observer), read the box
  // once — but never overwrite a real observation with the zero read.
  fallback = window.setTimeout(() => {
    if (!width.value) update(node.clientWidth, node.clientHeight)
  }, 0)
})
onBeforeUnmount(() => {
  if (fallback) clearTimeout(fallback)
  ro?.disconnect()
  ro = null
})
</script>

<template>
  <component
    :is="props.as"
    ref="root"
    :class="cn('dither-container', props.class)"
    :data-cq="state.size ?? undefined"
    :style="boxStyle"
  >
    <slot v-bind="slotState" />
  </component>
</template>

<style>
/* Container-relative traverses — distances measure the QUERY CONTAINER
   (cqw/cqh), never the animated element's own box and never the viewport,
   so every frame re-scales when the container resizes. Without a container
   ancestor the units fall back to small-viewport sizes (CSS spec), which
   still reads as motion. Use via `animation: dither-cq-traverse …`. */
@keyframes dither-cq-traverse {
  from {
    transform: translateX(-100cqw);
  }
  to {
    transform: translateX(100cqw);
  }
}
@keyframes dither-cq-rise {
  from {
    transform: translateY(-100cqh);
  }
  to {
    transform: translateY(100cqh);
  }
}
</style>
