<script setup lang="ts">
import { cn } from "./lib"
import DitherInput from "./DitherInput.vue"

/** Phone field: digits normalized into the (415) 555-2671 shape as you type
 * (10-digit NANP input), tel keyboard on mobile. The model is always the
 * formatted string; caret editing is end-anchored by design. */
const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    autocomplete?: string
    disabled?: boolean
    class?: string
  }>(),
  { placeholder: "(555) 123-4567", autocomplete: "tel" },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()

function format(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10)
  if (d.length === 0) return ""
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}
</script>

<template>
  <DitherInput
    v-bind="$attrs"
    type="tel"
    inputmode="tel"
    :model-value="props.modelValue ?? ''"
    :placeholder="props.placeholder"
    :autocomplete="props.autocomplete"
    :disabled="props.disabled"
    :class="cn(props.class)"
    @update:model-value="emit('update:modelValue', format($event))"
  />
</template>
