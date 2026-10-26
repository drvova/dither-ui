<!-- Generated from ../tailwind/Heading.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  levels1: { fontSize: "1.5rem", lineHeight: "calc(2 / 1.5)", fontWeight: "500", letterSpacing: "-0.025em" },
  levels2: {
    fontSize: "1.125rem",
    lineHeight: "calc(1.75 / 1.125)",
    fontWeight: "500",
    letterSpacing: "-0.025em",
  },
  levels3: { fontSize: "1rem", lineHeight: "calc(1.5 / 1)", fontWeight: "500", letterSpacing: "-0.025em" },
  levels4: { fontSize: "0.875rem", lineHeight: "calc(1.25 / 0.875)", fontWeight: "500" },
  levels5: { fontSize: "13px", fontWeight: "500" },
  levels6: { fontSize: "12px", fontWeight: "500" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

/** Semantic heading with the site's scale baked in: h1–h6 pick their own
 * size/weight from the level, `class` overrides anything below. */
const props = withDefaults(
  defineProps<{ level?: "1" | "2" | "3" | "4" | "5" | "6"; class?: string; xstyle?: StyleProp }>(),
  { level: "2" },
)

const LEVELS = {
  "1": styles.levels1,
  "2": styles.levels2,
  "3": styles.levels3,
  "4": styles.levels4,
  "5": styles.levels5,
  "6": styles.levels6,
} as const

const tag = computed(() => `h${props.level}`)
</script>

<template>
  <component :is="tag" :class="cn(LEVELS[props.level], props.xstyle, props.class)"><slot /></component>
</template>
