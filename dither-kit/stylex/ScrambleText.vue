<!-- Generated from ../tailwind/ScrambleText.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline-block", cursor: "default", fontFamily: "var(--font-mono)", whiteSpace: "pre" },
})
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue"
import { cn, type StyleProp } from "./lib"
import { pixelPrefersReducedMotion } from "../engine/pixel"

const props = withDefaults(
  defineProps<{
    text?: string
    speed?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { text: "Hover to scramble", speed: 1 },
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
  <span :class="cn(styles.text, props.xstyle, props.class)" :aria-label="props.text" @mouseenter="scramble">{{
    display
  }}</span>
</template>
