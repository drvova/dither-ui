<script setup lang="ts">
import { cn } from "./lib"
import DitherInput from "./DitherInput.vue"

/** Email field with the mobile keyboard and autofill contract baked in:
 * type=email, inputmode=email, autocomplete=email — the three things a bare
 * text input gets wrong. */
const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    autocomplete?: string
    disabled?: boolean
    invalid?: boolean
    class?: string
  }>(),
  { placeholder: "you@example.com", autocomplete: "email" },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()
</script>

<template>
  <DitherInput
    v-bind="$attrs"
    type="email"
    inputmode="email"
    :model-value="props.modelValue ?? ''"
    :placeholder="props.placeholder"
    :autocomplete="props.autocomplete"
    :disabled="props.disabled"
    :invalid="props.invalid"
    :class="cn(props.class)"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
