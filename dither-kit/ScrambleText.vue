<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    text?: string
    speed?: number
    class?: string
  }>(),
  { text: "Hover to scramble", speed: 1 }
)

const CHARS = "!<>-_\\/[]{}=+*^?#$%&ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
const target = computed(() => props.text)
const display = ref(props.text)
let raf = 0
let running = false
const rand = () => CHARS[Math.floor(Math.random() * CHARS.length)]

// A hover burst: every char randomises, then settles left-to-right.
function scramble() {
  if (pixelPrefersReducedMotion() || running) return
  running = true
  const t = target.value
  const settleEvery = Math.max(1, Math.round(2 / Math.max(0.1, props.speed)))
  const total = t.length * settleEvery + 6
  let frame = 0
  const tick = () => {
    frame++
    const settled = Math.floor(frame / settleEvery)
    let out = ""
    for (let i = 0; i < t.length; i++) out += i < settled ? t[i] : t[i] === " " ? " " : rand()
    display.value = out
    if (frame < total) raf = requestAnimationFrame(tick)
    else {
      display.value = t
      running = false
    }
  }
  raf = requestAnimationFrame(tick)
}

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <span
    :class="cn('inline-block cursor-default whitespace-pre font-mono', props.class)"
    :aria-label="props.text"
    @mouseenter="scramble"
  >{{ display }}</span>
</template>
