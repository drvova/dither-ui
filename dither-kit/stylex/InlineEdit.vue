<!-- Generated from ../tailwind/InlineEdit.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "inline-flex", width: "100%", minWidth: "0px" },
  button: {
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    borderRadius: "0.25rem",
    paddingInline: "0.375rem",
    paddingBlock: "0.25rem",
    textAlign: "left",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--accent) 10%, transparent)",
      },
    },
    boxShadow: {
      default: null,
      ":focus-visible": "0 0 0 calc(2px + 0px) color-mix(in oklab, var(--accent) 30%, transparent)",
    },
    outlineStyle: { default: null, ":focus-visible": "none" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  textMutedForeground: { color: "var(--muted-foreground)" },
  button2: { fontFamily: "var(--font-mono)", fontSize: "13px" },
  input: { paddingBlock: "0.25rem" },
})
</script>

<script setup lang="ts">
import { nextTick, ref } from "vue"
import { cn, type StyleProp } from "./lib"
import DitherInput from "./DitherInput.vue"

/** Click-to-edit text: view mode is a button (keyboard reachable), edit mode
 * is a focus-selected input. Enter or blur commits (only when the value
 * actually changed), Escape reverts — the revert flag suppresses the blur
 * commit that would otherwise fire as the input unmounts. */
const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { placeholder: "—", disabled: false },
)
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "save", value: string): void
  (e: "cancel"): void
}>()

const editing = ref(false)
const draft = ref("")
let canceled = false
let rootEl: HTMLInputElement | null = null

function setEditRef(el: unknown) {
  rootEl = (el as { $el?: HTMLInputElement } | null)?.$el ?? null
}

async function enterEdit() {
  if (props.disabled) return
  draft.value = props.modelValue ?? ""
  canceled = false
  editing.value = true
  await nextTick()
  rootEl?.focus()
  rootEl?.select()
}

function commit() {
  if (canceled) {
    canceled = false
    return
  }
  editing.value = false
  const value = draft.value
  if (value !== (props.modelValue ?? "")) {
    emit("update:modelValue", value)
    emit("save", value)
  }
}

function cancel() {
  canceled = true
  draft.value = props.modelValue ?? ""
  editing.value = false
  emit("cancel")
}
</script>

<template>
  <span :class="cn(styles.row, props.xstyle, props.class)">
    <button
      v-if="!editing"
      type="button"
      :disabled="props.disabled"
      :class="cn(styles.button, !props.modelValue && styles.textMutedForeground, styles.button2)"
      @click="enterEdit"
    >
      {{ props.modelValue || props.placeholder }}
    </button>
    <DitherInput
      v-else
      :ref="setEditRef"
      :model-value="draft"
      :placeholder="props.placeholder"
      :xstyle="styles.input"
      @update:model-value="draft = $event"
      @keydown.enter.prevent="commit"
      @keydown.esc.stop.prevent="cancel"
      @blur="commit"
    />
  </span>
</template>
