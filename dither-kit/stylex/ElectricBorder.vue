<!-- Generated from ../tailwind/ElectricBorder.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: {
    position: "relative",
    display: "inline-block",
    borderRadius: "12px",
    paddingInline: "1rem",
    paddingBlock: "0.5rem",
  },
  svg: { position: "absolute" },
  layer: { pointerEvents: "none", position: "absolute", inset: "0px", borderRadius: "12px" },
  frame2: { position: "relative" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    color?: string
    speed?: number
    thickness?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { color: "#5227FF", speed: 1, thickness: 2 },
)

const uid = `dither-electric-${Math.floor(Math.random() * 1e9)}`
const dur = computed(() => `${2 / Math.max(0.1, props.speed)}s`)
</script>

<template>
  <div :class="cn(styles.frame, props.xstyle, props.class)">
    <!-- 0x0 filter host: turbulence displaces the overlay border into an arc -->
    <svg width="0" height="0" v-bind="stylex.attrs(styles.svg)" aria-hidden="true">
      <defs>
        <filter :id="uid" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" seed="3" result="n">
            <animate attributeName="seed" from="0" to="12" :dur="dur" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" :scale="props.thickness * 3" />
        </filter>
      </defs>
    </svg>
    <div
      v-bind="stylex.attrs(styles.layer)"
      :style="{ border: `${props.thickness}px solid ${props.color}`, filter: `url(#${uid})` }"
      aria-hidden="true"
    />
    <div v-bind="stylex.attrs(styles.frame2)">
      <slot />
    </div>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  div[aria-hidden] {
    filter: none !important;
  }
}
</style>
