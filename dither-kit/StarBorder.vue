<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    color?: string
    speed?: number
    thickness?: number
    class?: string
  }>(),
  { color: "#7CFF67", speed: 6, thickness: 1 }
)

const glint = computed(() => `radial-gradient(circle, ${props.color}, transparent 12%)`)
</script>

<template>
  <div
    :class="cn('dither-star-border relative inline-block overflow-hidden rounded-[14px]', props.class)"
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
    <div class="relative z-[1] rounded-[13px] bg-background px-4 py-2">
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
