<!-- Generated from ../tailwind/FuzzyText.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", display: "inline-block" },
  svg: { position: "absolute" },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    text?: string
    intensity?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { text: "FUZZY", intensity: 4 },
)

const uid = `dither-fuzz-${Math.floor(Math.random() * 1e9)}`
</script>

<template>
  <span :class="cn([styles.frame, 'dither-fuzzy'], props.xstyle, props.class)" :aria-label="props.text">
    <!-- SVG turbulence + displacement drives an analog fuzz; native, no canvas -->
    <svg width="0" height="0" v-bind="stylex.attrs(styles.svg)" aria-hidden="true">
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
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            :scale="props.intensity"
            xChannelSelector="R"
            yChannelSelector="G"
          />
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
