<script setup lang="ts">
import { cn } from "./lib"

/** One-line ellipsis. Wraps any content in the `truncate` contract —
 * `title` rides through as an attr so native tooltips stay available. */
const props = withDefaults(
  defineProps<{ as?: string; title?: string; class?: string }>(),
  { as: "span" },
)
</script>

<template>
  <component :is="props.as" :title="props.title" :class="cn('block truncate', props.class)"><slot /></component>
</template>
