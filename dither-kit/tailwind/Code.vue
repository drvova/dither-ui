<script setup lang="ts">
import { cn } from "./lib"

/** Inline code — the `<code>` element in house chrome (small radius, card
 * fill). For the copyable, highlighted block see CodeBlock in the app layer. */
const props = defineProps<{ class?: string }>()
</script>

<template>
  <code
    :class="
      cn('rounded border border-border/60 bg-card/60 px-1 py-px font-mono text-[12px] text-foreground/90', props.class)
    "
  >
    <slot />
  </code>
</template>
