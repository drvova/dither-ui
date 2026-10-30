<!-- Generated from ../tailwind/ColorSwatch.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  button: {
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    scale: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "105% 105%",
        "@media (prefers-reduced-motion: reduce)": { default: null, "@media (hover: hover)": "100% 100%" },
      },
    },
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(2px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  ring2: {
    boxShadow: "0 0 0 2px var(--background), 0 0 0 calc(2px + 2px) color-mix(in oklab, var(--accent) 70%, transparent)",
  },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

/** One color as a pickable chip: a real button with the color in its
 * accessible name, selected state ring, keyboard focus ring. Pure display
 * when no `select` listener is wired. */
const props = withDefaults(
  defineProps<{
    color?: string
    label?: string
    selected?: boolean
    size?: number
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { color: "#5227FF", size: 24, disabled: false },
)
const emit = defineEmits<{ (e: "select", color: string): void }>()

const name = computed(() => props.label ?? props.color)
</script>

<template>
  <button
    type="button"
    :aria-label="`Select ${name}`"
    :aria-pressed="props.selected"
    :disabled="props.disabled"
    :style="{ background: props.color, width: `${props.size}px`, height: `${props.size}px` }"
    :class="cn(styles.button, props.selected && styles.ring2, props.xstyle, props.class)"
    @click="emit('select', props.color)"
  ></button>
</template>
