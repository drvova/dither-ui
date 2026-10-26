<!-- Generated from ../tailwind/Caption.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "block", fontSize: "11px" },
  textMutedForeground70: { color: "color-mix(in oklab, var(--muted-foreground) 70%, transparent)" },
  textMutedForeground: { color: "var(--muted-foreground)" },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

/** Supporting text under a title or figure — the caption register of the
 * type scale (11px, muted), with `faint` for the quietest tier. */
const props = withDefaults(defineProps<{ tone?: "muted" | "faint"; class?: string; xstyle?: StyleProp }>(), {
  tone: "muted",
})
</script>

<template>
  <span
    :class="
      cn(
        styles.text,
        props.tone === 'faint' ? styles.textMutedForeground70 : styles.textMutedForeground,
        props.xstyle,
        props.class,
      )
    "
  >
    <slot />
  </span>
</template>
