<!-- Generated from ../tailwind/TrueFocus.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "inline-flex", flexWrap: "wrap", columnGap: "0.35em", rowGap: "0.25rem" },
  text: {
    display: "inline-block",
    transitionProperty: "filter, opacity",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "500ms",
  },
})
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { cn, type StyleProp } from "./lib"
import { pixelPrefersReducedMotion } from "../engine/pixel"

const props = withDefaults(
  defineProps<{
    text?: string
    interval?: number
    blur?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { text: "True focus mode", interval: 1400, blur: 5 },
)

const words = computed(() => props.text.split(/\s+/).filter(Boolean))
const active = ref(0)
let timer = 0

onMounted(() => {
  if (pixelPrefersReducedMotion() || words.value.length < 2) return
  timer = window.setInterval(
    () => {
      active.value = (active.value + 1) % words.value.length
    },
    Math.max(300, props.interval),
  )
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <span :class="cn(styles.row, props.xstyle, props.class)" :aria-label="props.text">
    <span
      v-for="(w, i) in words"
      :key="i"
      aria-hidden="true"
      v-bind="stylex.attrs(styles.text)"
      class="dither-focus-word"
      :style="{ filter: i === active ? 'blur(0)' : `blur(${props.blur}px)`, opacity: i === active ? 1 : 0.5 }"
      >{{ w }}</span
    >
  </span>
</template>
