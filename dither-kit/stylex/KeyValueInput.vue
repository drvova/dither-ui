<!-- Generated from ../tailwind/KeyValueInput.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: { display: "grid", gap: "0.5rem" },
  row: { display: "flex", alignItems: "center", gap: "0.5rem" },
  box: { opacity: "40%" },
  input: { width: "calc(1 / 3 * 100%)", fontFamily: "var(--font-mono)", fontSize: "12.5px" },
  input2: { flex: "1" },
  button: {
    borderRadius: "0.25rem",
    padding: "0.375rem",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    pointerEvents: { default: null, ":disabled": "none" },
  },
  button2: {
    justifySelf: "flex-start",
    borderRadius: "0.25rem",
    borderStyle: "dashed",
    borderWidth: "1px",
    borderColor: {
      default: "color-mix(in oklab, var(--border) 70%, transparent)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 40%, transparent)",
      },
    },
    paddingInline: "0.625rem",
    paddingBlock: "0.25rem",
    fontSize: "12px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"
import DitherInput from "./DitherInput.vue"
import Icon from "./Icon.vue"

/** Repeatable key/value rows — headers, metadata, query params. Every edit
 * emits the whole array (the parent owns the source of truth); empty rows
 * are the caller's to keep or prune. */
interface KeyValueRow {
  key: string
  value: string
}

const props = withDefaults(
  defineProps<{ modelValue?: KeyValueRow[]; disabled?: boolean; class?: string; xstyle?: StyleProp }>(),
  {
    disabled: false,
  },
)
const emit = defineEmits<{ (e: "update:modelValue", value: KeyValueRow[]): void }>()

function clone(): KeyValueRow[] {
  return (props.modelValue ?? []).map((r) => ({ ...r }))
}

function updateRow(index: number, field: keyof KeyValueRow, text: string) {
  const next = clone()
  if (!next[index]) return
  next[index][field] = text
  emit("update:modelValue", next)
}

function addRow() {
  emit("update:modelValue", [...clone(), { key: "", value: "" }])
}

function removeRow(index: number) {
  emit(
    "update:modelValue",
    clone().filter((_, i) => i !== index),
  )
}
</script>

<template>
  <div :class="cn(styles.grid, props.xstyle, props.class)">
    <div v-for="(row, i) in props.modelValue ?? []" :key="i" :class="cn(styles.row, props.disabled && styles.box)">
      <DitherInput
        :model-value="row.key"
        placeholder="key"
        :disabled="props.disabled"
        :xstyle="styles.input"
        @update:model-value="updateRow(i, 'key', $event)"
      />
      <DitherInput
        :model-value="row.value"
        placeholder="value"
        :disabled="props.disabled"
        :xstyle="styles.input2"
        @update:model-value="updateRow(i, 'value', $event)"
      />
      <button
        type="button"
        :aria-label="`Remove row ${i + 1}`"
        :disabled="props.disabled"
        v-bind="stylex.attrs(styles.button)"
        @click="removeRow(i)"
      >
        <Icon name="Close" :size="13" />
      </button>
    </div>
    <button type="button" :disabled="props.disabled" v-bind="stylex.attrs(styles.button2)" @click="addRow">
      + Add row
    </button>
  </div>
</template>
