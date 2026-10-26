<script setup lang="ts">
import { cn } from "./lib"
import DitherCheckbox from "./DitherCheckbox.vue"

/** The whole card is the checkbox's label — title and description ride
 * along, one click anywhere toggles, the peer focus ring shows keyboard
 * focus. Checkbox stays the source of truth (native semantics preserved). */
const props = withDefaults(
  defineProps<{
    label?: string
    description?: string
    modelValue?: boolean
    disabled?: boolean
    class?: string
  }>(),
  { label: "", disabled: false },
)
const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>()
</script>

<template>
  <label
    class="flex cursor-pointer items-start gap-3 rounded-md border border-border/70 bg-card/40 p-3 transition-colors hover:border-foreground/30 has-[:checked]:border-accent/60 has-[:checked]:bg-accent/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/30 motion-reduce:transition-none"
    :class="cn(props.disabled && 'pointer-events-none opacity-40', props.class)"
  >
    <DitherCheckbox
      :model-value="props.modelValue ?? false"
      :disabled="props.disabled"
      class="mt-0.5"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <span class="grid gap-1">
      <span v-if="props.label" class="text-[13px] font-medium leading-none text-foreground">
        {{ props.label }}
      </span>
      <span v-if="props.description" class="text-[12px] leading-snug text-muted-foreground">
        {{ props.description }}
      </span>
      <span class="text-[12px] leading-snug text-muted-foreground/70"><slot /></span>
    </span>
  </label>
</template>
