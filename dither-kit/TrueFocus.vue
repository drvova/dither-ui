<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    text?: string
    interval?: number
    blur?: number
    class?: string
  }>(),
  { text: "True focus mode", interval: 1400, blur: 5 }
)

const words = computed(() => props.text.split(/\s+/).filter(Boolean))
const active = ref(0)
let timer = 0

onMounted(() => {
  if (pixelPrefersReducedMotion() || words.value.length < 2) return
  timer = window.setInterval(() => {
    active.value = (active.value + 1) % words.value.length
  }, Math.max(300, props.interval))
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <span :class="cn('inline-flex flex-wrap gap-x-[0.35em] gap-y-1', props.class)" :aria-label="props.text">
    <span
      v-for="(w, i) in words"
      :key="i"
      aria-hidden="true"
      class="dither-focus-word inline-block transition-[filter,opacity] duration-500"
      :style="{ filter: i === active ? 'blur(0)' : `blur(${props.blur}px)`, opacity: i === active ? 1 : 0.5 }"
    >{{ w }}</span>
  </span>
</template>
