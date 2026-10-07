<script setup lang="ts">
import { cn } from "./lib"
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
  defineProps<{ modelValue?: KeyValueRow[]; disabled?: boolean; class?: string }>(),
  { disabled: false },
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
  emit("update:modelValue", clone().filter((_, i) => i !== index))
}
</script>

<template>
  <div class="grid gap-2" :class="cn(props.class)">
    <div
      v-for="(row, i) in props.modelValue ?? []"
      :key="i"
      class="flex items-center gap-2"
      :class="props.disabled && 'opacity-40'"
    >
      <DitherInput
        :model-value="row.key"
        placeholder="key"
        :disabled="props.disabled"
        class="w-1/3 font-mono text-[12.5px]"
        @update:model-value="updateRow(i, 'key', $event)"
      />
      <DitherInput
        :model-value="row.value"
        placeholder="value"
        :disabled="props.disabled"
        class="flex-1"
        @update:model-value="updateRow(i, 'value', $event)"
      />
      <button
        type="button"
        :aria-label="`Remove row ${i + 1}`"
        :disabled="props.disabled"
        class="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none motion-reduce:transition-none"
        @click="removeRow(i)"
      >
        <Icon name="Close" :size="13" />
      </button>
    </div>
    <button
      type="button"
      :disabled="props.disabled"
      class="justify-self-start rounded border border-dashed border-border/70 px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none"
      @click="addRow"
    >
      + Add row
    </button>
  </div>
</template>
