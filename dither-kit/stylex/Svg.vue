<!-- Generated from ../tailwind/Svg.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

/** Neutral SVG wrapper: no imposed stroke/fill language — the kit's own art
 * direction stays in the components. A11y follows the icon rule: decorative
 * by default (`aria-hidden`), `label` promotes it to an image with a name. */
const props = withDefaults(
  defineProps<{
    viewBox?: string
    label?: string
    class?: string
    xstyle?: StyleProp
  }>(),
  {},
)

const a11y = computed(() =>
  props.label ? { role: "img", "aria-label": props.label } : ({ "aria-hidden": "true", focusable: "false" } as const),
)
</script>

<template>
  <svg :viewBox="props.viewBox" v-bind="a11y" :class="cn(null, props.xstyle, props.class)"><slot /></svg>
</template>
