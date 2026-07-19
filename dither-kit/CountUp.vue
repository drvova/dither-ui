<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    to: number
    from?: number
    duration?: number
    decimals?: number
    class?: string
  }>(),
  { from: 0, duration: 1500, decimals: 0 }
)

const el = ref<HTMLElement | null>(null)
const value = ref(props.from)
let raf = 0
let io: IntersectionObserver | null = null
let started = false

function run() {
  if (started) return
  started = true
  if (pixelPrefersReducedMotion()) {
    value.value = props.to
    return
  }
  const t0 = performance.now()
  const d = Math.max(1, props.duration)
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / d)
    const e = 1 - Math.pow(1 - p, 3)
    value.value = props.from + (props.to - props.from) * e
    if (p < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}

onMounted(() => {
  if (typeof IntersectionObserver === "undefined") {
    run()
    return
  }
  io = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) run()
  })
  if (el.value) io.observe(el.value)
})
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  io?.disconnect()
})

const display = computed(() =>
  value.value.toLocaleString(undefined, {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals,
  })
)
</script>

<template>
  <span ref="el" :class="cn('tabular-nums', props.class)">{{ display }}</span>
</template>
