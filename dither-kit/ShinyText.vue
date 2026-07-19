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
  background-image: linear-gradient(
    120deg,
    rgba(255, 255, 255, 0.35) 40%,
    #ffffff 50%,
    rgba(255, 255, 255, 0.35) 60%
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
    color: rgba(255, 255, 255, 0.8);
  }
}
</style>
