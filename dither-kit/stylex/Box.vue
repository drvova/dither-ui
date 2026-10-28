<!-- Generated from ../tailwind/Box.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

/** Container primitive: one element, one job — `class` carries the rest of the
 * styling. `as` swaps the tag (div for blocks, span for inline contexts,
 * section/article for landmarks) without touching the slot. Unknown attrs
 * (id, data-*, aria-*) fall through to the element untouched. */
const props = withDefaults(
  defineProps<{
    as?: string
    class?: string
    xstyle?: StyleProp
  }>(),
  { as: "div" },
)
</script>

<template>
  <component :is="props.as" :class="cn(null, props.xstyle, props.class)"><slot /></component>
</template>
