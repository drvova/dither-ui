<!-- Generated from ../tailwind/Overline.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "block", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" },
  textMutedForeground70: { color: "color-mix(in oklab, var(--muted-foreground) 70%, transparent)" },
  textMutedForeground: { color: "var(--muted-foreground)" },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

/** The tiny uppercase eyebrow above section titles — 10px, open tracking,
 * muted; the editorial "OVERLINE" register. */
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
