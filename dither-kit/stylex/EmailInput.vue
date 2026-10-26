<!-- Generated from ../tailwind/EmailInput.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script setup lang="ts">
import { type StyleProp } from "./lib"
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
    xstyle?: StyleProp
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
    :xstyle="[props.xstyle, props.class]"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
