<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    speed?: number
    disabled?: boolean
    class?: string
  }>(),
  { speed: 1, disabled: false }
)

const dur = computed(() => `${Math.max(0.4, 5 / Math.max(0.01, props.speed))}s`)
</script>

<template>
  <span
    :class="cn('dither-shiny-text', props.class)"
    :style="{ animationDuration: dur, animationPlayState: props.disabled ? 'paused' : 'running' }"
  ><slot /></span>
</template>

<style scoped>
.dither-shiny-text {
  display: inline-block;
  color: transparent;
  /* Sheen inks from the foreground token, so it survives both themes. */
  background-image: linear-gradient(
    120deg,
    color-mix(in oklab, var(--foreground) 35%, transparent) 40%,
    var(--foreground) 50%,
    color-mix(in oklab, var(--foreground) 35%, transparent) 60%
  );
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  animation: dither-shine linear infinite;
}
@keyframes dither-shine {
  to {
    background-position: -220% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dither-shiny-text {
    animation: none;
    color: color-mix(in oklab, var(--foreground) 80%, transparent);
  }
}
</style>
