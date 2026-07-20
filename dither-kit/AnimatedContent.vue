<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    distance?: number
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

const hidden = computed(() => {
  const d = props.distance * (props.reverse ? -1 : 1)
  return props.direction === "horizontal" ? `translateX(${d}px)` : `translateY(${d}px)`
})

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
