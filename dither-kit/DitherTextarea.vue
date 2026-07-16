<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"
import { cssColor } from "./palette"
import { CONTROL, useField } from "./control"

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  rows?: number
  resize?: "none" | "vertical" | "horizontal" | "both"
  disabled?: boolean
  readonly?: boolean
  invalid?: boolean
  class?: string
}>(), { modelValue: "", rows: 4, resize: "vertical", disabled: false, readonly: false, invalid: false })
const emit = defineEmits<{ "update:modelValue": [value: string] }>()
const field = useField()
const invalid = computed(() => props.invalid || field?.invalid.value || false)
</script>

<template>
  <textarea
    :id="($attrs.id as string | undefined) ?? field?.controlId.value"
    :value="props.modelValue"
    :placeholder="props.placeholder"
    :rows="props.rows"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :aria-invalid="invalid || undefined"
    :aria-describedby="($attrs['aria-describedby'] as string | undefined) ?? field?.describedBy.value"
    :style="{ resize: props.resize, ...(invalid ? { borderColor: cssColor('red') } : {}) }"
    :class="cn(CONTROL, 'block w-full leading-relaxed read-only:cursor-default read-only:bg-card/40 read-only:text-muted-foreground', props.class)"
    v-bind="$attrs"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
