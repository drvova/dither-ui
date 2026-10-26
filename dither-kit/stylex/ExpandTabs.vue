<!-- Generated from ../tailwind/ExpandTabs.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    display: "inline-flex",
    gap: "0.25rem",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 40%, transparent)",
    padding: "0.25rem",
  },
  button: {
    display: "flex",
    height: "2rem",
    alignItems: "center",
    gap: "0px",
    borderRadius: "var(--radius)",
    paddingInline: "0.625rem",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  button2: { backgroundColor: "var(--card)", color: "var(--foreground)" },
  button3: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--card) 60%, transparent)",
      },
    },
  },
  text: { width: "0.375rem", height: "0.375rem", flexShrink: "0", borderRadius: "1px" },
  grid: {
    display: "grid",
    transitionProperty: { default: "grid-template-columns", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  text2: { minWidth: "0px", overflow: "hidden", whiteSpace: "nowrap" },
  text3: { paddingLeft: "0.5rem" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cssColor } from "../engine/palette"
import { cn, type StyleProp } from "./lib"
import type { PixelColor } from "../engine/pixel"

export type ExpandTab = { value: string; label: string; color?: PixelColor }

/** Icon bar where only the active tab unfolds its label — the rest stay
 * square glyphs. The label slides through a 0fr -> 1fr column, the house
 * grid trick, stilled under reduced motion. */
const props = withDefaults(
  defineProps<{
    tabs: ExpandTab[]
    modelValue: string
    color?: PixelColor
    class?: string
    xstyle?: StyleProp
  }>(),
  { color: "blue" },
)
const emit = defineEmits<{ "update:modelValue": [string] }>()

const hue = computed(() => (t: ExpandTab) => cssColor(t.color ?? props.color))
</script>

<template>
  <div :class="cn(styles.row, props.xstyle, props.class)" role="tablist">
    <button
      v-for="t in props.tabs"
      :key="t.value"
      type="button"
      role="tab"
      :aria-selected="props.modelValue === t.value"
      :class="cn(styles.button, props.modelValue === t.value ? styles.button2 : styles.button3)"
      @click="emit('update:modelValue', t.value)"
    >
      <span
        aria-hidden="true"
        v-bind="stylex.attrs(styles.text)"
        :style="{
          background: props.modelValue === t.value ? hue(t) : 'currentColor',
          opacity: props.modelValue === t.value ? 1 : 0.7,
        }"
      />
      <span
        v-bind="stylex.attrs(styles.grid)"
        :style="{ gridTemplateColumns: props.modelValue === t.value ? '1fr' : '0fr' }"
      >
        <span :class="cn(styles.text2, props.modelValue === t.value ? styles.text3 : null)">{{ t.label }}</span>
      </span>
    </button>
  </div>
</template>
