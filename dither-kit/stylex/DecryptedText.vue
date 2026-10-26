<!-- Generated from ../tailwind/DecryptedText.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline-block", fontFamily: "var(--font-mono)", whiteSpace: "pre" },
})
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { directedTime, isDirected, onSeek } from "../engine/clock"
import { cn, type StyleProp } from "./lib"
import { pixelPrefersReducedMotion } from "../engine/pixel"

const props = withDefaults(
  defineProps<{
    text?: string
    speed?: number
    trigger?: "view" | "hover"
    class?: string
    xstyle?: StyleProp
  }>(),
  { text: "DECRYPTED", speed: 1, trigger: "view" },
)

const CHARS = "!<>-_\\/[]{}=+*^?#ABCDEF0123456789"
const target = computed(() => props.text)
const display = ref("")
const el = ref<HTMLElement | null>(null)
let raf = 0
let io: IntersectionObserver | null = null
let running = false

const rand = () => CHARS[Math.floor(Math.random() * CHARS.length)]
/** A directed render must repeat: the glyph is a hash of (frame, slot). */
const seededChar = (frame: number, i: number) =>
  CHARS[((Math.imul(frame + 1, 2654435761) ^ Math.imul(i + 1, 40503)) >>> 0) % CHARS.length]

/** The text at a decrypt frame, or null once the reveal is complete. */
function frameText(frame: number, seeded: boolean): string | null {
  const t = target.value
  const revealEvery = Math.max(1, Math.round(3 / Math.max(0.1, props.speed)))
  if (frame >= t.length * revealEvery + 8) return null
  const revealed = Math.floor(frame / revealEvery)
  let out = ""
  for (let i = 0; i < t.length; i++)
    out += i < revealed ? t[i] : t[i] === " " ? " " : seeded ? seededChar(frame, i) : rand()
  return out
}

function scramble() {
  if (running) return
  running = true
  let frame = 0
  const tick = () => {
    const out = frameText(++frame, false)
    if (out === null || isDirected()) {
      display.value = target.value
      running = false
      return
    }
    display.value = out
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}

// Directed (clock.ts): the reveal runs at 60 frames per second of the moment.
function seekTo(ms: number) {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
  running = false
  display.value = frameText(Math.floor(ms / (1000 / 60)), true) ?? target.value
}
const unseek = onSeek((ms) => (ms === null ? scramble() : seekTo(ms)))

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
  if (isDirected()) {
    seekTo(directedTime() ?? 0)
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
  unseek()
  if (raf) cancelAnimationFrame(raf)
  io?.disconnect()
})
</script>

<template>
  <span
    ref="el"
    :class="cn(styles.text, props.xstyle, props.class)"
    :aria-label="props.text"
    @mouseenter="props.trigger === 'hover' && scramble()"
    >{{ display }}</span
  >
</template>
