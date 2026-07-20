<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    items?: string[]
    radius?: number
    duration?: number
    size?: number
    class?: string
  }>(),
  { items: () => ["A", "B", "C", "D", "E"], radius: 80, duration: 16, size: 200 }
)

const placed = computed(() => {
  const n = props.items.length || 1
  return props.items.map((it, i) => {
    const a = (i / n) * Math.PI * 2
    return { it, x: Math.sin(a) * props.radius, y: -Math.cos(a) * props.radius }
  })
})
</script>

<template>
  <div
    :class="cn('relative grid place-items-center', props.class)"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
    aria-hidden="true"
  >
    <div class="dither-orbit absolute inset-0" :style="{ animationDuration: `${props.duration}s` }">
      <span
        v-for="(p, i) in placed"
        :key="i"
        class="absolute left-1/2 top-1/2 grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card text-xs"
        :style="{ transform: `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)` }"
      >
        <span class="dither-orbit-label" :style="{ animationDuration: `${props.duration}s` }">{{ p.it }}</span>
      </span>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.dither-orbit {
  animation: dither-orbit-spin linear infinite;
}
@keyframes dither-orbit-spin {
  to {
    transform: rotate(360deg);
  }
}
.dither-orbit-label {
  display: block;
  animation: dither-orbit-counter linear infinite;
}
@keyframes dither-orbit-counter {
  to {
    transform: rotate(-360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .dither-orbit,
  .dither-orbit-label {
    animation: none;
  }
}
</style>
