<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"
import { cssColor } from "./palette"
import { CONTROL, useField } from "./control"

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: string
    type?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    invalid?: boolean
    class?: string
  }>(),
  { modelValue: "", type: "text", disabled: false, invalid: false }
)

const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()
const field = useField()
const invalid = computed(() => props.invalid || field?.invalid.value || false)
const invalidStyle = computed(() => invalid.value ? { borderColor: cssColor("red") } : undefined)
</script>

<template>
  <input
    :type="props.type"
    :value="props.modelValue"
    :placeholder="props.placeholder"
    :id="($attrs.id as string | undefined) ?? field?.controlId.value"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :aria-invalid="invalid || undefined"
    :aria-describedby="($attrs['aria-describedby'] as string | undefined) ?? field?.describedBy.value"
    :style="invalidStyle"
    :class="
      cn(
        CONTROL,
        'w-full read-only:cursor-default read-only:bg-card/40 read-only:text-muted-foreground',
        props.class
      )
    "
    v-bind="$attrs"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
