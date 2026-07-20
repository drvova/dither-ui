<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    items?: string[]
    speed?: number
    gap?: number
    class?: string
  }>(),
  { items: () => ["DITHER", "BAYER", "CANVAS", "VUE", "PIXELS"], speed: 18, gap: 48 }
)

// Duplicated once so translateX(-50%) wraps seamlessly.
const loop = computed(() => [...props.items, ...props.items])
</script>

<template>
  <div :class="cn('overflow-hidden', props.class)" aria-hidden="true">
    <div class="dither-logoloop flex w-max" :style="{ animationDuration: `${props.speed}s` }">
      <span v-for="(it, i) in loop" :key="i" class="shrink-0 whitespace-nowrap" :style="{ paddingRight: `${props.gap}px` }">{{ it }}</span>
    </div>
  </div>
</template>

<style scoped>
.dither-logoloop {
  animation: dither-loop linear infinite;
  will-change: transform;
}
@keyframes dither-loop {
  to {
    transform: translateX(-50%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .dither-logoloop {
    animation: none;
  }
}
</style>
