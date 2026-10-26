<!-- Generated from ../tailwind/SelectableText.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  component: { WebkitUserSelect: "all", userSelect: "all" },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

/** Text that selects itself on click (`user-select: all`) — license keys,
 * tokens, one-tap copy targets. Wraps any inline content. */
const props = withDefaults(defineProps<{ as?: string; class?: string; xstyle?: StyleProp }>(), { as: "span" })
</script>

<template>
  <component :is="props.as" :class="cn(styles.component, props.xstyle, props.class)"><slot /></component>
</template>
