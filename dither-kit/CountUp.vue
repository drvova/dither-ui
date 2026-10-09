<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { directedTime, isDirected, onSeek } from "./clock"
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

/** The count at progress p (eased out). */
const at = (p: number) => {
  const e = 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3)
  value.value = props.from + (props.to - props.from) * e
}
const duration = () => Math.max(1, props.duration)

function run() {
  if (started) return
  started = true
  if (pixelPrefersReducedMotion()) {
    value.value = props.to
    return
  }
  // Directed (clock.ts): the count is the moment's, no frames requested.
  if (isDirected()) {
    at((directedTime() ?? 0) / duration())
    return
  }
  const t0 = performance.now()
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / duration())
    at(p)
    if (p < 1 && !isDirected()) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}
const unseek = onSeek((ms) => {
  if (ms === null || !started) return
  if (raf) cancelAnimationFrame(raf)
  raf = 0
  at(ms / duration())
})

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
  unseek()
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
