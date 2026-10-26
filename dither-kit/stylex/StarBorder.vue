<!-- Generated from ../tailwind/StarBorder.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", display: "inline-block", overflow: "hidden", borderRadius: "14px" },
  frame2: {
    position: "relative",
    zIndex: "1",
    borderRadius: "13px",
    backgroundColor: "var(--background)",
    paddingInline: "1rem",
    paddingBlock: "0.5rem",
  },
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
  { color: "#7CFF67", speed: 6, thickness: 1 },
)

const glint = computed(() => `radial-gradient(circle, ${props.color}, transparent 12%)`)
</script>

<template>
  <div
    :class="cn([styles.frame, 'dither-star-border'], props.xstyle, props.class)"
    :style="{ padding: `${props.thickness}px` }"
  >
    <span
      class="star-strip star-bottom"
      :style="{ background: glint, animationDuration: `${props.speed}s` }"
      aria-hidden="true"
    />
    <span
      class="star-strip star-top"
      :style="{ background: glint, animationDuration: `${props.speed}s` }"
      aria-hidden="true"
    />
    <div v-bind="stylex.attrs(styles.frame2)">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.star-strip {
  position: absolute;
  width: 300%;
  height: 50%;
  border-radius: 50%;
  opacity: 0.7;
}
.star-bottom {
  bottom: -11px;
  right: -250%;
  animation: dither-star-move linear infinite alternate;
}
.star-top {
  top: -11px;
  left: -250%;
  animation: dither-star-move-rev linear infinite alternate;
}
@keyframes dither-star-move {
  to {
    transform: translateX(-100%);
  }
}
@keyframes dither-star-move-rev {
  to {
    transform: translateX(100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .star-strip {
    animation: none;
  }
}
</style>
