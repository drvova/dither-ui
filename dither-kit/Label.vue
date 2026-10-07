<script setup lang="ts">
import { cn } from "./lib"

/** A real `<label>` — pairs with controls through the `for` attr (or by
 * nesting), which is the whole point over a styled span. */
const props = withDefaults(
  defineProps<{ required?: boolean; class?: string }>(),
  { required: false },
)
</script>

<template>
  <label :class="cn('inline-flex items-center gap-1 text-[12px] text-foreground', props.class)">
    <slot />
    <span v-if="props.required" class="text-muted-foreground" aria-hidden="true">*</span>
  </label>
</template>
