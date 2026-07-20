<script setup lang="ts">
import { cn } from "./lib"

defineProps<{ class?: string }>()
</script>

<template>
  <div :class="cn('dither-glare group relative overflow-hidden rounded-[12px]', $props.class)">
    <slot />
    <div class="glare pointer-events-none absolute inset-0" aria-hidden="true" />
  </div>
</template>

<style scoped>
.glare {
  background: linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.35) 50%, transparent 70%);
  background-size: 250% 250%;
  background-position: 150% 150%;
  transition: background-position 650ms ease;
}
.group:hover .glare {
  background-position: -50% -50%;
}
@media (prefers-reduced-motion: reduce) {
  .glare {
    transition: none;
  }
}
</style>
