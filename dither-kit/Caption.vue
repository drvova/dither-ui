<script setup lang="ts">
import { cn } from "./lib"

/** Supporting text under a title or figure — the caption register of the
 * type scale (11px, muted), with `faint` for the quietest tier. */
const props = withDefaults(
  defineProps<{ tone?: "muted" | "faint"; class?: string }>(),
  { tone: "muted" },
)
</script>

<template>
  <span
    :class="
      cn(
        'block text-[11px]',
        props.tone === 'faint' ? 'text-muted-foreground/70' : 'text-muted-foreground',
        props.class,
      )
    "
  >
    <slot />
  </span>
</template>
