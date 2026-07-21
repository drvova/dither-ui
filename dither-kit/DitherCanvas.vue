<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

/** Work-surface backdrop — the dotted or ruled field a dashboard sits on.
 * Pure CSS: the pattern inks with the border token and stays behind content. */
const props = withDefaults(
  defineProps<{
    pattern?: "dots" | "grid" | "plain"
    /** Pattern pitch in CSS pixels. */
    cell?: number
    class?: string
  }>(),
  { pattern: "dots", cell: 16 }
)

const layer = computed(() => {
  const c = `${props.cell}px`
  if (props.pattern === "dots")
    return {
      backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
      backgroundSize: `${c} ${c}`,
    }
  if (props.pattern === "grid")
    return {
      backgroundImage:
        "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
      backgroundSize: `${c} ${c}`,
    }
  return {}
})
</script>

<template>
  <div :class="cn('relative min-h-0 overflow-auto bg-background/40', props.class)">
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 opacity-40" :style="layer" />
    <div class="relative">
      <slot />
    </div>
  </div>
</template>
