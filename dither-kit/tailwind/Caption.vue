<script setup lang="ts">
import { cn } from "./lib"

/** Supporting text under a title or figure — the caption register of the
 * type scale (11px, muted). `faint` shares the muted ink: no text in the
 * kit drops under AA (4.5:1). */
const props = withDefaults(defineProps<{ tone?: "muted" | "faint"; class?: string }>(), { tone: "muted" })
</script>

<template>
  <span :class="cn('block text-[11px] text-muted-foreground', props.class)">
    <slot />
  </span>
</template>
