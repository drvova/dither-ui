<!-- Generated from ../tailwind/Truncate.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  component: { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

/** One-line ellipsis. Wraps any content in the `truncate` contract —
 * `title` rides through as an attr so native tooltips stay available. */
const props = withDefaults(defineProps<{ as?: string; title?: string; class?: string; xstyle?: StyleProp }>(), {
  as: "span",
})
</script>

<template>
  <component :is="props.as" :title="props.title" :class="cn(styles.component, props.xstyle, props.class)"
    ><slot
  /></component>
</template>
