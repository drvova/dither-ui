<!-- Generated from ../tailwind/Text.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  tonesDefault: { color: "var(--foreground)" },
  tonesMuted: { color: "var(--muted-foreground)" },
  tonesFaint: { color: "color-mix(in oklab, var(--muted-foreground) 70%, transparent)" },
  sizesXs: { fontSize: "11px" },
  sizesSm: { fontSize: "12px" },
  sizesMd: { fontSize: "13px" },
  sizesLg: { fontSize: "15px" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

/** Text primitive on the site's native type scale. `as` picks the element
 * (p default; span/h3/li/… for context), `tone` maps to the shadcn token
 * utilities, `size` to the 11–15px scale the docs use — anything else
 * (leading, tracking, weight) rides along in `class`. */
const props = withDefaults(
  defineProps<{
    as?: string
    tone?: "default" | "muted" | "faint"
    size?: "xs" | "sm" | "md" | "lg"
    class?: string
    xstyle?: StyleProp
  }>(),
  { as: "p", tone: "default" },
)

const TONES = {
  default: styles.tonesDefault,
  muted: styles.tonesMuted,
  faint: styles.tonesFaint,
} as const

const SIZES = {
  xs: styles.sizesXs,
  sm: styles.sizesSm,
  md: styles.sizesMd,
  lg: styles.sizesLg,
} as const

const classes = computed(() => cn(props.size && SIZES[props.size], TONES[props.tone], props.xstyle, props.class))
</script>

<template>
  <component :is="props.as" :class="cn(classes)"><slot /></component>
</template>
