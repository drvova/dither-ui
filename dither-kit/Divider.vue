<script setup lang="ts">
import { cn } from "./lib"

/** Hairline rule. Horizontal renders a real `hr` (separator semantics come
 * for free); vertical is a flex-row citizen that stretches to the row height.
 * Both announce `role="separator"` with the right orientation. */
const props = withDefaults(
  defineProps<{
    orientation?: "horizontal" | "vertical"
    class?: string
  }>(),
  { orientation: "horizontal" },
)
</script>

<template>
  <component
    :is="props.orientation === 'vertical' ? 'div' : 'hr'"
    role="separator"
    :aria-orientation="props.orientation"
    :class="
      cn(
        props.orientation === 'vertical'
          ? 'w-px self-stretch bg-border/60'
          : 'h-px w-full border-0 bg-border/60',
        props.class,
      )
    "
  />
</template>
