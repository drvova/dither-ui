<script setup lang="ts">
import { cn } from "./lib"

/** Container-level focus highlight: wraps a control group and shows the ring
 * while anything inside holds focus (`focus-within`), so keyboard users can
 * see WHICH group is active — the individual control keeps the global
 * `:focus-visible` floor from styles.css. */
const props = defineProps<{ class?: string }>()
</script>

<template>
  <div
    :class="
      cn(
        'rounded-md focus-within:ring-2 focus-within:ring-foreground/70 focus-within:ring-offset-2 focus-within:ring-offset-background',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
