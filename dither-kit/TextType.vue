<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    texts?: string[]
    typingSpeed?: number
    deletingSpeed?: number
    pause?: number
    loop?: boolean
    cursor?: boolean
    class?: string
  }>(),
  { texts: () => ["Type this out.", "Then this."], typingSpeed: 60, deletingSpeed: 35, pause: 1400, loop: true, cursor: true }
)

const shown = ref("")
let ti = 0
let timer = 0

function schedule(fn: () => void, ms: number) {
  timer = window.setTimeout(fn, Math.max(0, ms))
}
function list() {
  return props.texts.length ? props.texts : [""]
}
function type() {
  const full = list()[ti % list().length]
  if (shown.value.length < full.length) {
    shown.value = full.slice(0, shown.value.length + 1)
    schedule(type, props.typingSpeed)
  } else if (props.loop || ti < list().length - 1) {
    schedule(del, props.pause)
  }
}
function del() {
  if (shown.value.length > 0) {
    shown.value = shown.value.slice(0, -1)
    schedule(del, props.deletingSpeed)
  } else {
    ti++
    schedule(type, 220)
  }
}

onMounted(() => {
  if (pixelPrefersReducedMotion()) {
    shown.value = list()[0]
    return
  }
  schedule(type, 300)
})
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <span :class="cn('inline-block whitespace-pre', props.class)"
    ><span>{{ shown }}</span
    ><span v-if="props.cursor" class="dither-caret" aria-hidden="true">|</span
  ></span>
</template>

<style scoped>
.dither-caret {
  animation: dither-blink 1s steps(1) infinite;
}
@keyframes dither-blink {
  50% {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dither-caret {
    animation: none;
  }
}
</style>
