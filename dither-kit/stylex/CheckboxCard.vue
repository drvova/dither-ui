<!-- Generated from ../tailwind/CheckboxCard.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  label: {
    display: "flex",
    cursor: "pointer",
    alignItems: "flex-start",
    gap: "0.75rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: {
      default: "color-mix(in oklab, var(--border) 70%, transparent)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 30%, transparent)",
      },
    },
    backgroundColor: "color-mix(in oklab, var(--card) 40%, transparent)",
    padding: "0.75rem",
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
  checkbox: { marginTop: "0.125rem" },
  grid: { display: "grid", gap: "0.25rem" },
  text: { fontSize: "13px", lineHeight: "1", fontWeight: "500", color: "var(--foreground)" },
  text2: { fontSize: "12px", lineHeight: "1.375", color: "var(--muted-foreground)" },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"
import DitherCheckbox from "./DitherCheckbox.vue"

/** The whole card is the checkbox's label — title and description ride
 * along, one click anywhere toggles, the peer focus ring shows keyboard
 * focus. Checkbox stays the source of truth (native semantics preserved). */
const props = withDefaults(
  defineProps<{
    label?: string
    description?: string
    modelValue?: boolean
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { label: "", disabled: false },
)
const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>()
</script>

<template>
  <label
    :class="cn(styles.label, 'dk-check-card', props.disabled && styles.pointerEventsNone, props.xstyle, props.class)"
  >
    <DitherCheckbox
      :model-value="props.modelValue ?? false"
      :disabled="props.disabled"
      :xstyle="styles.checkbox"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <span v-bind="stylex.attrs(styles.grid)">
      <span v-if="props.label" v-bind="stylex.attrs(styles.text)">
        {{ props.label }}
      </span>
      <span v-if="props.description" v-bind="stylex.attrs(styles.text2)">
        {{ props.description }}
      </span>
      <span v-bind="stylex.attrs(styles.text2)"><slot /></span>
    </span>
  </label>
</template>

<style scoped>
/* The card answers the checkbox inside it (a button with role="checkbox",
   whose state is aria-checked): checked tints it, keyboard focus rings it. */
.dk-check-card:has([aria-checked="true"]) {
  border-color: color-mix(in oklab, var(--accent) 60%, transparent);
  background-color: color-mix(in oklab, var(--accent) 10%, transparent);
}
.dk-check-card:has(:focus-visible) {
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--accent) 30%, transparent);
}
</style>
