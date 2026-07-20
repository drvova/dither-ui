<script setup lang="ts">
import { cn } from "./lib"

defineProps<{ class?: string }>()
</script>

<template>
  <div :class="cn('dither-sticker group relative inline-block', $props.class)">
    <div class="relative z-[1]">
      <slot />
    </div>
    <div class="dither-peel pointer-events-none absolute bottom-0 right-0" aria-hidden="true" />
  </div>
</template>

<style scoped>
.dither-peel {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, transparent 50%, rgba(0, 0, 0, 0.35) 50%, rgba(255, 255, 255, 0.18));
  border-bottom-right-radius: 8px;
  transform-origin: bottom right;
  transition: transform 300ms ease, box-shadow 300ms ease;
}
.group:hover .dither-peel {
  transform: rotate(-12deg) translate(-2px, -2px) scale(1.35);
  box-shadow: -4px -4px 10px rgba(0, 0, 0, 0.3);
}
@media (prefers-reduced-motion: reduce) {
  .dither-peel {
    transition: none;
  }
}
</style>
