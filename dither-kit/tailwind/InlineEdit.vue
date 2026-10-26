<script setup lang="ts">
import { nextTick, ref } from "vue"
import { cn } from "./lib"
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
  <span :class="cn('inline-flex w-full min-w-0', props.class)">
    <button
      v-if="!editing"
      type="button"
      :disabled="props.disabled"
      class="max-w-full truncate rounded px-1.5 py-1 text-left transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-40"
      :class="cn(!props.modelValue && 'text-muted-foreground/70', 'font-mono text-[13px]')"
      @click="enterEdit"
    >
      {{ props.modelValue || props.placeholder }}
    </button>
    <DitherInput
      v-else
      :ref="setEditRef"
      :model-value="draft"
      :placeholder="props.placeholder"
      class="py-1"
      @update:model-value="draft = $event"
      @keydown.enter.prevent="commit"
      @keydown.esc.stop.prevent="cancel"
      @blur="commit"
    />
  </span>
</template>
