<!-- Generated from ../tailwind/DitherKbd.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  kbd: {
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--background)",
    paddingInline: "0.375rem",
    paddingBlock: "0.125rem",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--foreground)",
  },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

const props = defineProps<{ class?: string; xstyle?: StyleProp }>()
</script>

<template>
  <kbd :class="cn(styles.kbd, props.xstyle, props.class)" style="border-bottom-width: 2px">
    <slot />
  </kbd>
</template>
