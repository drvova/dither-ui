<script setup lang="ts">
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    text?: string
    intensity?: number
    class?: string
  }>(),
  { text: "FUZZY", intensity: 4 }
)

const uid = `dither-fuzz-${Math.floor(Math.random() * 1e9)}`
</script>

<template>
  <span :class="cn('dither-fuzzy relative inline-block', props.class)" :aria-label="props.text">
    <!-- SVG turbulence + displacement drives an analog fuzz; native, no canvas -->
    <svg width="0" height="0" class="absolute" aria-hidden="true">
      <defs>
        <filter :id="uid" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.4" numOctaves="2" seed="7" result="n">
            <animate
              attributeName="baseFrequency"
              dur="1.6s"
              values="0.012 0.4;0.02 0.55;0.012 0.4"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" :scale="props.intensity" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
    <span aria-hidden="true" :style="{ filter: `url(#${uid})` }">{{ props.text }}</span>
  </span>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .dither-fuzzy span[aria-hidden] {
    filter: none !important;
  }
}
</style>
