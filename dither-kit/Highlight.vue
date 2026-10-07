<script setup lang="ts">
import { cn } from "./lib"

/** Inline highlight: the `<mark>` element with a neutral token wash (the
 * colored variants ride in `class`). Neutral because house color comes from
 * palette seeds, not hardcoded accents. */
const props = defineProps<{ class?: string }>()
</script>

<template>
  <mark :class="cn('rounded-sm bg-foreground/10 px-0.5 text-inherit', props.class)"><slot /></mark>
</template>
