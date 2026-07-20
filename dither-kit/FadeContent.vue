<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    duration?: number
    delay?: number
    blur?: boolean
    class?: string
  }>(),
  { duration: 1000, delay: 0, blur: false }
)

const el = ref<HTMLElement | null>(null)
const shown = ref(false)
let io: IntersectionObserver | null = null

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
    :class="cn('dither-fade-content', props.class)"
    :style="{
      opacity: shown ? 1 : 0,
      filter: props.blur && !shown ? 'blur(10px)' : 'blur(0)',
      transitionDuration: `${props.duration}ms`,
      transitionDelay: `${props.delay}ms`,
    }"
  >
    <slot />
  </div>
</template>

<style scoped>
.dither-fade-content {
  transition-property: opacity, filter;
  transition-timing-function: ease-out;
}
@media (prefers-reduced-motion: reduce) {
  .dither-fade-content {
    transition: none;
  }
}
</style>
