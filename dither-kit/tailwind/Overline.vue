<script setup lang="ts">
import { cn } from "./lib"

/** The tiny uppercase eyebrow above section titles — 10px, open tracking,
 * muted; the editorial "OVERLINE" register. `faint` shares the muted ink:
 * no text in the kit drops under AA (4.5:1). */
const props = withDefaults(defineProps<{ tone?: "muted" | "faint"; class?: string }>(), { tone: "muted" })
</script>

<template>
  <span :class="cn('block text-[10px] uppercase tracking-[0.2em] text-muted-foreground', props.class)">
    <slot />
  </span>
</template>
