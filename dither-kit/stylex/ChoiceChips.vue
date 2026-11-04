<!-- Generated from ../tailwind/ChoiceChips.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

let chipsCount = 0

const styles = stylex.create({
  row: { display: "flex", flexWrap: "wrap", gap: "0.375rem" },
  text: {
    flexBasis: "100%",
    fontSize: "12px",
    fontWeight: "500",
    color: "color-mix(in oklab, var(--foreground) 90%, transparent)",
  },
  label: {
    cursor: "pointer",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    paddingInline: "0.75rem",
    paddingBlock: "0.375rem",
    fontSize: "12px",
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
  borderAccent70: {
    borderColor: "color-mix(in oklab, var(--accent) 70%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--accent) 15%, transparent)",
    color: "var(--foreground)",
  },
  borderBorder70: {
    borderColor: {
      default: "color-mix(in oklab, var(--border) 70%, transparent)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 30%, transparent)",
      },
    },
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
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
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

/** Chip-style choice group: the chip is the LABEL of a real radio (or
 * checkbox when `multiple`), so native keyboard semantics and focus come for
 * free — no roving tabindex to get wrong; the radios share one name, so the
 * arrows move between them and the group is one Tab stop. `value` is a
 * string for single and a string array for multiple. `label` names the
 * group: shown on its own line over the chips and tied to it. */
const props = withDefaults(
  defineProps<{
    label?: string
    options?: string[]
    /** The choice (v-model); `value` is the older name, still read. */
    modelValue?: string | string[]
    value?: string | string[]
    multiple?: boolean
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { options: () => [], disabled: false },
)
const base = `dk-chips-${chipsCount++}`
const emit = defineEmits<{ (e: "update:modelValue", value: string | string[]): void }>()

const current = computed(() => props.modelValue ?? props.value)
const selected = computed(() =>
  props.multiple
    ? Array.isArray(current.value)
      ? current.value
      : []
    : typeof current.value === "string"
      ? current.value
      : "",
)

function isChecked(option: string): boolean {
  return props.multiple ? selected.value.includes(option) : selected.value === option
}

function onChange(option: string, checked: boolean) {
  if (props.multiple) {
    const set = new Set(selected.value)
    if (checked) set.add(option)
    else set.delete(option)
    emit("update:modelValue", [...set])
  } else {
    emit("update:modelValue", option)
  }
}
</script>

<template>
  <div
    role="group"
    :aria-labelledby="props.label ? `${base}-label` : undefined"
    :class="cn(styles.row, props.xstyle, props.class)"
    :aria-disabled="props.disabled || undefined"
  >
    <span v-if="props.label" :id="`${base}-label`" v-bind="stylex.attrs(styles.text)">{{ props.label }}</span>
    <label
      v-for="option in props.options"
      :key="option"
      :class="
        cn(
          styles.label,
          isChecked(option) ? styles.borderAccent70 : styles.borderBorder70,
          props.disabled && styles.pointerEventsNone,
        )
      "
    >
      <input
        v-bind="stylex.attrs(styles.input)"
        :type="props.multiple ? 'checkbox' : 'radio'"
        :name="`${base}-choice`"
        :value="option"
        :checked="isChecked(option)"
        :disabled="props.disabled"
        @change="onChange(option, ($event.target as HTMLInputElement).checked)"
      />
      {{ option }}
    </label>
  </div>
</template>
