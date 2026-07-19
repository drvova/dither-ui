<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    colors?: string[]
    speed?: number
    class?: string
  }>(),
  { colors: () => ["#358ff3", "#7CFF67", "#358ff3"], speed: 1 }
)

const bg = computed(
  () => `linear-gradient(90deg, ${(props.colors.length ? props.colors : ["#ffffff"]).join(", ")})`
)
const dur = computed(() => `${Math.max(0.2, 6 / Math.max(0.01, props.speed))}s`)
</script>

<template>
  <span
    :class="cn('dither-gradient-text', props.class)"
    :style="{ backgroundImage: bg, animationDuration: dur }"
  ><slot /></span>
</template>

<style scoped>
.dither-gradient-text {
  display: inline-block;
  background-size: 300% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: dither-gt linear infinite;
}
@keyframes dither-gt {
  to {
    background-position: 300% center;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dither-gradient-text {
    animation: none;
  }
}
</style>
