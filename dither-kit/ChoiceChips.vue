<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

/** Chip-style choice group: the chip is the LABEL of a real radio (or
 * checkbox when `multiple`), so native keyboard semantics and focus come for
 * free — no roving tabindex to get wrong. `value` is a string for single and
 * a string array for multiple. */
const props = withDefaults(
  defineProps<{
    options?: string[]
    value?: string | string[]
    multiple?: boolean
    disabled?: boolean
    class?: string
  }>(),
  { options: () => [], disabled: false },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string | string[]): void }>()

const selected = computed(() =>
  props.multiple ? (Array.isArray(props.value) ? props.value : []) : typeof props.value === "string" ? props.value : "",
)

function isChecked(option: string): boolean {
  return props.multiple
    ? selected.value.includes(option)
    : selected.value === option
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
    :class="cn('flex flex-wrap gap-1.5', props.class)"
    :aria-disabled="props.disabled || undefined"
  >
    <label
      v-for="option in props.options"
      :key="option"
      class="cursor-pointer select-none rounded-full border px-3 py-1.5 text-[12px] transition-colors motion-reduce:transition-none"
      :class="
        cn(
          isChecked(option)
            ? 'border-accent/70 bg-accent/15 text-foreground'
            : 'border-border/70 text-muted-foreground hover:border-foreground/30 hover:text-foreground',
          props.disabled && 'pointer-events-none opacity-40',
        )
      "
    >
      <input
        class="sr-only"
        :type="props.multiple ? 'checkbox' : 'radio'"
        :value="option"
        :checked="isChecked(option)"
        :disabled="props.disabled"
        @change="onChange(option, ($event.target as HTMLInputElement).checked)"
      />
      {{ option }}
    </label>
  </div>
</template>
