<script setup lang="ts">
import { cn } from "./lib"

/** Screen-reader-only content. `focusable` reveals it on keyboard focus with
 * skip-link styling — the pattern for "visible only to whom it matters", and
 * the a11y-floor alternative to `aria-label` when the label must also exist in
 * the reading order. */
const props = withDefaults(
  defineProps<{
    focusable?: boolean
    class?: string
  }>(),
  { focusable: false },
)
</script>

<template>
  <span
    :class="
      cn(
        'sr-only',
        props.focusable &&
          'focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:border focus:bg-background focus:px-2 focus:py-1 focus:text-[11px] focus:text-foreground',
        props.class,
      )
    "
  >
    <slot />
  </span>
</template>
