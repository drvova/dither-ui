<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"
import { ICONS, type IconName } from "./icons"

/** One glyph from the hand-rolled set: 24×24 stroke geometry in currentColor,
 * sized in px (default 16). A11y follows the icon rule — decorative by
 * default, `label` promotes it to role=img with a name. An unknown name is a
 * loud error, never an empty box. */
const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number
    label?: string
    strokeWidth?: number
    class?: string
  }>(),
  { size: 16, strokeWidth: 2 },
)

const paths = computed(() => {
  const glyph = ICONS[props.name]
  if (!glyph) throw new Error(`[dither-kit] unknown icon: "${props.name}"`)
  return [...glyph]
})

const a11y = computed(() =>
  props.label
    ? { role: "img", "aria-label": props.label }
    : ({ "aria-hidden": "true", focusable: "false" } as const),
)
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="props.strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    v-bind="a11y"
    :class="cn('', props.class)"
  >
    <path v-for="(d, i) in paths" :key="i" :d="d" />
  </svg>
</template>
