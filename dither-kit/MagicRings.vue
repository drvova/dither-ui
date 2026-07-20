<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    color?: string
    count?: number
    duration?: number
    class?: string
  }>(),
  { color: "#7CFF67", count: 4, duration: 3 }
)

const rings = computed(() => Math.max(1, Math.round(props.count)))
</script>

<template>
  <div :class="cn('relative grid place-items-center overflow-hidden', props.class)">
    <slot />
    <span
      v-for="i in rings"
      :key="i"
      class="dither-ring pointer-events-none absolute rounded-full"
      :style="{
        borderColor: props.color,
        animationDuration: `${props.duration}s`,
        animationDelay: `${-((i - 1) * props.duration) / rings}s`,
      }"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.dither-ring {
  width: 40px;
  height: 40px;
  border: 2px solid;
  animation: dither-ring-expand ease-out infinite;
}
@keyframes dither-ring-expand {
  0% {
    transform: scale(0.2);
    opacity: 0.9;
  }
  100% {
    transform: scale(6);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dither-ring {
    animation: none;
    opacity: 0.3;
  }
}
</style>
