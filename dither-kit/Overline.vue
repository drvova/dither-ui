<script setup lang="ts">
import { cn } from "./lib"

/** The tiny uppercase eyebrow above section titles — 10px, open tracking,
 * muted; the editorial "OVERLINE" register. */
const props = withDefaults(
  defineProps<{ tone?: "muted" | "faint"; class?: string }>(),
  { tone: "muted" },
)
</script>

<template>
  <span
    :class="
      cn(
        'block text-[10px] uppercase tracking-[0.2em]',
        props.tone === 'faint' ? 'text-muted-foreground/70' : 'text-muted-foreground',
        props.class,
      )
    "
  >
    <slot />
  </span>
</template>
