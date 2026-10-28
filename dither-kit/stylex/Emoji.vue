<!-- Generated from ../tailwind/Emoji.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline-block", lineHeight: "1" },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

/** An emoji as an IMAGE with a real accessible name: `role="img"` +
 * `aria-label` gives screen readers one predictable announcement instead of
 * whatever the glyph's unicode name happens to be. Pass the character, pass
 * what it means here. */
const props = withDefaults(defineProps<{ char?: string; label?: string; class?: string; xstyle?: StyleProp }>(), {
  char: "✨",
  label: "",
})
</script>

<template>
  <span role="img" :aria-label="props.label || undefined" :class="cn(styles.text, props.xstyle, props.class)">{{
    props.char
  }}</span>
</template>
