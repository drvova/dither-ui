<script setup lang="ts">
import { cn } from "./lib"

/** An emoji as an IMAGE with a real accessible name: `role="img"` +
 * `aria-label` gives screen readers one predictable announcement instead of
 * whatever the glyph's unicode name happens to be. Pass the character, pass
 * what it means here. */
const props = withDefaults(defineProps<{ char?: string; label?: string; class?: string }>(), {
  char: "✨",
  label: "",
})
</script>

<template>
  <span
    role="img"
    :aria-label="props.label || undefined"
    :class="cn('inline-block leading-none', props.class)"
    >{{ props.char }}</span
  >
</template>
