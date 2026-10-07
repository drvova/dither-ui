<script setup lang="ts">
import { cn } from "./lib"

/** Quoted aside: real `<blockquote>` semantics with the editorial treatment —
 * hairline left rule, muted register. Cite lives in the slot (or the `cite`
 * attr). */
const props = defineProps<{ class?: string }>()
</script>

<template>
  <blockquote :class="cn('border-l-2 border-border/60 pl-4 text-[13px] leading-relaxed text-muted-foreground', props.class)">
    <slot />
  </blockquote>
</template>
