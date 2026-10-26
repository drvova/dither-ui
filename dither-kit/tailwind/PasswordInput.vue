<script setup lang="ts">
import { ref } from "vue"
import { cn } from "./lib"
import DitherInput from "./DitherInput.vue"
import Icon from "./Icon.vue"

/** Password field with a reveal toggle: type flips text/password, the button
 * carries the accessible name and never submits (type=button). */
const props = defineProps<{
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  class?: string
}>()
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()

const shown = ref(false)
</script>

<template>
  <div class="relative">
    <DitherInput
      v-bind="$attrs"
      :model-value="props.modelValue ?? ''"
      :type="shown ? 'text' : 'password'"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :invalid="props.invalid"
      :class="cn('pr-9', props.class)"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <button
      type="button"
      :aria-label="shown ? 'Hide password' : 'Show password'"
      :aria-pressed="shown"
      class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      @click="shown = !shown"
    >
      <Icon :name="shown ? 'EyeOff' : 'Eye'" :size="14" />
    </button>
  </div>
</template>
