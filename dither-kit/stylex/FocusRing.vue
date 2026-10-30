<!-- Generated from ../tailwind/FocusRing.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: {
    borderRadius: "var(--radius)",
    boxShadow: {
      default: null,
      ":focus-within": "0 0 0 2px var(--background), 0 0 0 calc(2px + 2px) var(--ring)",
    },
  },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

/** Container-level focus highlight: wraps a control group and shows the ring
 * while anything inside holds focus (`focus-within`), so keyboard users can
 * see WHICH group is active — the individual control keeps the global
 * `:focus-visible` floor from styles.css. */
const props = defineProps<{ class?: string; xstyle?: StyleProp }>()
</script>

<template>
  <div :class="cn(styles.box, props.xstyle, props.class)">
    <slot />
  </div>
</template>
