<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    /** px (number) or any CSS length — `"4cqw"` measures the nearest query
     * container, making the reveal container-relative. */
    distance?: number | string
    direction?: "vertical" | "horizontal"
    reverse?: boolean
    duration?: number
    delay?: number
    class?: string
  }>(),
  { distance: 40, direction: "vertical", reverse: false, duration: 800, delay: 0 }
)

const el = ref<HTMLElement | null>(null)
const shown = ref(false)
let io: IntersectionObserver | null = null

/** Offsets are signed: numbers are px; strings pass through as CSS lengths
 * with the sign flipped for `reverse` (`"4cqh"` → `"-4cqh"`). */
function offset(): string {
  if (typeof props.distance === "number") {
    return `${props.distance * (props.reverse ? -1 : 1)}px`
  }
  const negative = props.distance.startsWith("-") !== props.reverse
  const body = props.distance.startsWith("-") ? props.distance.slice(1) : props.distance
  return negative ? `-${body}` : body
}

const hidden = computed(() =>
  props.direction === "horizontal" ? `translateX(${offset()})` : `translateY(${offset()})`,
)

onMounted(() => {
  if (pixelPrefersReducedMotion() || typeof IntersectionObserver === "undefined") {
    shown.value = true
    return
  }
  io = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) {
      shown.value = true
      io?.disconnect()
    }
  })
  if (el.value) io.observe(el.value)
})
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <div
    ref="el"
    :class="cn('dither-animated-content', props.class)"
    :style="{
      opacity: shown ? 1 : 0,
      transform: shown ? 'none' : hidden,
      transitionDuration: `${props.duration}ms`,
      transitionDelay: `${props.delay}ms`,
    }"
  >
    <slot />
  </div>
</template>

<style scoped>
.dither-animated-content {
  transition-property: opacity, transform;
  transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
}
@media (prefers-reduced-motion: reduce) {
  .dither-animated-content {
    transition: none;
  }
}
</style>
