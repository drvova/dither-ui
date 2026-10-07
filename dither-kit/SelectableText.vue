<script setup lang="ts">
import { cn } from "./lib"

/** Text that selects itself on click (`user-select: all`) — license keys,
 * tokens, one-tap copy targets. Wraps any inline content. */
const props = withDefaults(
  defineProps<{ as?: string; class?: string }>(),
  { as: "span" },
)
</script>

<template>
  <component :is="props.as" :class="cn('select-all', props.class)"><slot /></component>
</template>
