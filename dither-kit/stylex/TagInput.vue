<!-- Generated from ../tailwind/TagInput.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    display: "flex",
    minHeight: "2.5rem",
    width: "100%",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.375rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: {
      default: "var(--border)",
      ":focus-within": "color-mix(in oklab, var(--accent) 70%, transparent)",
    },
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    transitionProperty: { default: "border-color, box-shadow", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: {
      default: null,
      ":focus-within": "0 0 0 calc(2px + 0px) color-mix(in oklab, var(--accent) 20%, transparent)",
    },
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
  row2: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 70%, transparent)",
    backgroundColor: "var(--card)",
    paddingInline: "0.375rem",
    paddingBlock: "0.125rem",
    fontSize: "12px",
  },
  button: {
    margin: "-5px",
    borderRadius: "0.25rem",
    padding: "7px",
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
  },
  input: {
    minWidth: "5rem",
    flex: "1",
    backgroundColor: "transparent",
    fontSize: "13px",
    color: "var(--foreground)",
    outlineStyle: "none",
    "::placeholder": { color: "var(--muted-foreground)" },
  },
})
</script>

<script setup lang="ts">
import { ref } from "vue"
import { cn, type StyleProp } from "./lib"
import Icon from "./Icon.vue"

/** Tags as chips in one field: Enter or comma commits, Backspace on an empty
 * input pulls the last chip back in, per-chip × removes. Trimmed, case-
 * deduped, `max`-capped (the oldest chip stays put when full). */
const props = withDefaults(
  defineProps<{
    modelValue?: string[]
    placeholder?: string
    max?: number
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { placeholder: "Add tag…", max: Infinity, disabled: false },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string[]): void }>()

const draft = ref("")

function add(raw: string) {
  const tag = raw.trim()
  if (!tag || props.disabled) return
  const current = props.modelValue ?? []
  if (current.length >= props.max) return
  if (current.some((t) => t.toLowerCase() === tag.toLowerCase())) {
    draft.value = ""
    return
  }
  emit("update:modelValue", [...current, tag])
  draft.value = ""
}

function remove(index: number) {
  const next = (props.modelValue ?? []).filter((_, i) => i !== index)
  emit("update:modelValue", next)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault()
    add(draft.value)
  } else if (e.key === "Backspace" && draft.value === "") {
    const current = props.modelValue ?? []
    if (current.length > 0) remove(current.length - 1)
  }
}
</script>

<template>
  <div :class="cn(styles.row, props.disabled && styles.pointerEventsNone, props.xstyle, props.class)">
    <span v-for="(tag, i) in props.modelValue ?? []" :key="`${tag}-${i}`" v-bind="stylex.attrs(styles.row2)">
      {{ tag }}
      <button type="button" :aria-label="`Remove ${tag}`" v-bind="stylex.attrs(styles.button)" @click="remove(i)">
        <Icon name="Close" :size="10" />
      </button>
    </span>
    <input
      v-if="!props.disabled"
      v-model="draft"
      :placeholder="(props.modelValue ?? []).length === 0 ? props.placeholder : ''"
      :aria-label="props.placeholder || 'Add a tag'"
      v-bind="stylex.attrs(styles.input)"
      @keydown="onKeydown"
      @blur="add(draft)"
    />
  </div>
</template>
