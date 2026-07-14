<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"
import { cssColor } from "./palette"

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: string
    type?: string
    placeholder?: string
    disabled?: boolean
    invalid?: boolean
    class?: string
  }>(),
  { modelValue: "", type: "text", disabled: false, invalid: false }
)

const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()

// Inline style wins over the border-border / focus:border-accent classes,
// so an invalid input stays red-bordered even while focused.
const invalidStyle = computed(() =>
  props.invalid ? { borderColor: cssColor("red") } : undefined
)
</script>

<template>
  <input
    v-bind="$attrs"
    :type="props.type"
    :value="props.modelValue"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :aria-invalid="props.invalid || undefined"
    :style="invalidStyle"
    :class="
      cn(
        'w-full rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60 transition-colors focus:border-accent/60 disabled:pointer-events-none disabled:opacity-40',
        props.class
      )
    "
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
