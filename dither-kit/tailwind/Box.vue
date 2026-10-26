<script setup lang="ts">
import { cn } from "./lib"

/** Container primitive: one element, one job — `class` carries the rest of the
 * styling. `as` swaps the tag (div for blocks, span for inline contexts,
 * section/article for landmarks) without touching the slot. Unknown attrs
 * (id, data-*, aria-*) fall through to the element untouched. */
const props = withDefaults(
  defineProps<{
    as?: string
    class?: string
  }>(),
  { as: "div" },
)
</script>

<template>
  <component :is="props.as" :class="cn('', props.class)"><slot /></component>
</template>
