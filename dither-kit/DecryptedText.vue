<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    text?: string
    speed?: number
    trigger?: "view" | "hover"
    class?: string
  }>(),
  { text: "DECRYPTED", speed: 1, trigger: "view" }
)

const CHARS = "!<>-_\\/[]{}=+*^?#ABCDEF0123456789"
const target = computed(() => props.text)
const display = ref("")
const el = ref<HTMLElement | null>(null)
let raf = 0
let io: IntersectionObserver | null = null
let running = false

const rand = () => CHARS[Math.floor(Math.random() * CHARS.length)]

function scramble() {
  if (running) return
  running = true
  const t = target.value
  const revealEvery = Math.max(1, Math.round(3 / Math.max(0.1, props.speed)))
  const total = t.length * revealEvery + 8
  let frame = 0
  const tick = () => {
    frame++
    const revealed = Math.floor(frame / revealEvery)
    let out = ""
    for (let i = 0; i < t.length; i++) out += i < revealed ? t[i] : t[i] === " " ? " " : rand()
    display.value = out
    if (frame < total) raf = requestAnimationFrame(tick)
    else {
      display.value = t
      running = false
    }
  }
  raf = requestAnimationFrame(tick)
}

onMounted(() => {
  display.value = target.value.replace(/[^ ]/g, "?")
  if (pixelPrefersReducedMotion()) {
    display.value = target.value
    return
  }
  if (props.trigger === "hover") {
    display.value = target.value
    return
  }
  if (typeof IntersectionObserver === "undefined") {
    scramble()
    return
  }
  io = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) {
      scramble()
      io?.disconnect()
    }
  })
  if (el.value) io.observe(el.value)
})
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  io?.disconnect()
})
</script>

<template>
  <span
    ref="el"
    :class="cn('inline-block whitespace-pre font-mono', props.class)"
    :aria-label="props.text"
    @mouseenter="props.trigger === 'hover' && scramble()"
  >{{ display }}</span>
</template>
