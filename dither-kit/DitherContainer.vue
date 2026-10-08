<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { CONTAINER_SCALE, quantize, resolveCq, type CqScale } from "./containers"

const props = withDefaults(
  defineProps<{
    /** Bucket scale in container px — declaration order irrelevant. */
    scale?: CqScale
    /** Quantize `--cq-w` to this many px (0 = continuous). */
    step?: number
    /** Native `container-name` for `@container` rules in children's styles. */
    name?: string
    as?: string
    class?: string
  }>(),
  { scale: () => CONTAINER_SCALE, step: 0, name: "dither", as: "div" },
)

const root = ref<HTMLElement | null>(null)
/** 0 until the first observation — the honest pre-measure width. */
const width = ref(0)
let ro: ResizeObserver | null = null
let fallback = 0

function update(next: number): void {
  const w = Math.max(0, Math.round(next))
  if (width.value !== w) width.value = w
}

const state = computed(() => resolveCq(width.value, props.scale))
/** What children receive: the resolution plus the raw measured width. */
const slotState = computed(() => ({ ...state.value, width: width.value }))
/** container-type/name make the node a native query container too — children
 * can use stylesheet `@container <name>` without any of this JS. */
const boxStyle = computed(() => ({
  containerType: "inline-size",
  containerName: props.name,
  "--cq-w": String(props.step > 0 ? quantize(width.value, props.step) : width.value),
  "--cq-i": String(state.value.index),
}))

onMounted(() => {
  const node = root.value
  if (!node) return
  // contentRect = the content box, i.e. exactly what `@container` measures,
  // and transform-proof (use-chart-dimensions precedent). Without a
  // ResizeObserver the state simply stays at the 0-width bucket.
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      update(entry ? entry.contentRect.width : node.clientWidth)
    })
    ro.observe(node)
  }
  // First-paint guard: if nothing reported (silent observer), read the box
  // once — but never overwrite a real observation with the zero read.
  fallback = window.setTimeout(() => {
    if (!width.value) update(node.clientWidth)
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
