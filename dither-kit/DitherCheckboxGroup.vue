<script setup lang="ts">
import DitherCheckbox from "./DitherCheckbox.vue"
import type { Option } from "./DitherSelect.vue"
import { cn } from "./lib"
import type { PixelColor } from "./pixel"

const props = withDefaults(
  defineProps<{
    options: Option[]
    modelValue: string[]
    color?: PixelColor
    label?: string
    class?: string
  }>(),
  { color: "blue" }
)

const emit = defineEmits<{ (e: "update:modelValue", value: string[]): void }>()

function toggle(value: string, on: boolean) {
  emit(
    "update:modelValue",
    on
      ? [...props.modelValue, value]
      : props.modelValue.filter((v) => v !== value)
  )
}
</script>

<template>
  <div role="group" :aria-label="props.label" :class="cn('grid gap-3', props.class)">
    <DitherCheckbox
      v-for="o in props.options"
      :key="o.value"
      :model-value="props.modelValue.includes(o.value)"
      :color="props.color"
      :disabled="o.disabled"
      @update:model-value="(on) => toggle(o.value, on)"
    >
      {{ o.label }}
    </DitherCheckbox>
  </div>
</template>
