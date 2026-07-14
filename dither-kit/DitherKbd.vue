<script setup lang="ts">
import { cn } from "./lib"

const props = defineProps<{ class?: string }>()
</script>

<template>
  <kbd
    :class="
      cn(
        'rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] text-foreground',
        props.class
      )
    "
    style="border-bottom-width: 2px"
  >
    <slot />
  </kbd>
</template>
