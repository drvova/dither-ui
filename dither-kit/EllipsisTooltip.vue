<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"

/** Truncation with the tooltip attached only when it earns it: observes its
 * own overflow (ResizeObserver, no forced reads) and — clipped — publishes the
 * full slot text as `title`. Unclipped content gets no tooltip at all, which
 * is the point. Degraded engines just render the text. */
const props = withDefaults(
  defineProps<{ as?: string; enabled?: boolean; class?: string }>(),
  { as: "span", enabled: true },
)

const root = ref<HTMLElement | null>(null)
const clipped = ref(false)
const full = ref("")
let ro: ResizeObserver | null = null

function measure() {
  const el = root.value
  if (!el || !props.enabled) {
    clipped.value = false
    return
  }
  full.value = (el.textContent || "").trim()
  clipped.value = el.scrollWidth > el.clientWidth + 1
}

onMounted(() => {
  measure()
  if (typeof ResizeObserver === "undefined" || !root.value) return
  ro = new ResizeObserver(measure)
  ro.observe(root.value)
})
onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
})
</script>

<template>
  <component :is="props.as" ref="root" :title="clipped ? full : undefined" :class="cn('block truncate', props.class)">
    <slot />
  </component>
</template>
