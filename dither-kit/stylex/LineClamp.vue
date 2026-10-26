<!-- Generated from ../tailwind/LineClamp.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  clamps1: { overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: "1" },
  clamps2: { overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: "2" },
  clamps3: { overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: "3" },
  clamps4: { overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: "4" },
  clamps5: { overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: "5" },
  clamps6: { overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: "6" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

/** Clamped block with a real ellipsis after N lines (1–6). */
const props = withDefaults(
  defineProps<{ lines?: 1 | 2 | 3 | 4 | 5 | 6; as?: string; class?: string; xstyle?: StyleProp }>(),
  {
    lines: 3,
    as: "p",
  },
)

// Literal classes so Tailwind ships every variant.
const CLAMPS = {
  1: styles.clamps1,
  2: styles.clamps2,
  3: styles.clamps3,
  4: styles.clamps4,
  5: styles.clamps5,
  6: styles.clamps6,
} as const

const classes = computed(() => cn(CLAMPS[props.lines], props.xstyle, props.class))
</script>

<template>
  <component :is="props.as" :class="cn(classes)"><slot /></component>
</template>
