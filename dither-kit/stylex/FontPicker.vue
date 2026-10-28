<!-- Generated from ../tailwind/FontPicker.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: {
    display: "grid",
    gap: "0.25rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    padding: "0.375rem",
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
  label: {
    display: "flex",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    borderRadius: "0.25rem",
    paddingInline: "0.625rem",
    paddingBlock: "0.5rem",
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  label2: {
    backgroundColor: "color-mix(in oklab, var(--accent) 15%, transparent)",
    color: "var(--foreground)",
  },
  label3: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--accent) 10%, transparent)",
      },
    },
  },
  input: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  },
  text: { fontSize: "13px" },
  text2: { fontSize: "11px", color: "var(--muted-foreground)" },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

/** Font stack picker: each option renders its own name in its own family so
 * the preview IS the choice — no separate swatch to drift. Value = the CSS
 * font stack string. */
const FONT_STACKS: Array<{ label: string; stack: string }> = [
  { label: "System UI", stack: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { label: "Geometric sans", stack: "'Futura', 'Century Gothic', 'Avenir', sans-serif" },
  { label: "Humanist sans", stack: "'Segoe UI', 'Frutiger', 'Helvetica Neue', sans-serif" },
  { label: "Old-style serif", stack: "'Charter', 'Georgia', 'Times New Roman', serif" },
  { label: "Transitional serif", stack: "'Libre Baskerville', 'Georgia', serif" },
  { label: "Monospace", stack: "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace" },
  { label: "Console", stack: "'Lucida Console', 'Menlo', 'DejaVu Sans Mono', monospace" },
  { label: "Display", stack: "'Impact', 'Haettenschweiler', 'Arial Narrow Bold', sans-serif" },
  { label: "Rounded", stack: "'Nunito', 'Segoe UI', system-ui, sans-serif" },
  { label: "Handwriting", stack: "'Segoe Script', 'Comic Sans MS', cursive" },
]

const props = withDefaults(
  defineProps<{ modelValue?: string; disabled?: boolean; class?: string; xstyle?: StyleProp }>(),
  {
    disabled: false,
  },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()
</script>

<template>
  <div
    role="radiogroup"
    aria-label="Font"
    :class="cn(styles.grid, props.disabled && styles.pointerEventsNone, props.xstyle, props.class)"
  >
    <label
      v-for="font in FONT_STACKS"
      :key="font.stack"
      :class="cn(styles.label, modelValue === font.stack ? styles.label2 : styles.label3)"
    >
      <input
        v-bind="stylex.attrs(styles.input)"
        type="radio"
        name="dk-font-picker"
        :value="font.stack"
        :checked="modelValue === font.stack"
        :disabled="props.disabled"
        @change="emit('update:modelValue', font.stack)"
      />
      <span v-bind="stylex.attrs(styles.text)" :style="{ fontFamily: font.stack }">{{ font.label }}</span>
      <span v-bind="stylex.attrs(styles.text2)">Aa 123</span>
    </label>
  </div>
</template>
