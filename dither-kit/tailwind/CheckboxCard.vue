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
    class="dk-check-card flex cursor-pointer items-start gap-3 rounded-md border border-border/70 bg-card/40 p-3 transition-colors hover:border-foreground/30 motion-reduce:transition-none"
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

<style scoped>
/* The card answers the checkbox inside it (a button with role="checkbox",
   whose state is aria-checked): checked tints it, keyboard focus rings it. */
.dk-check-card:has([aria-checked="true"]) {
  border-color: color-mix(in oklab, var(--accent) 60%, transparent);
  background-color: color-mix(in oklab, var(--accent) 10%, transparent);
}
.dk-check-card:has(:focus-visible) {
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--accent) 30%, transparent);
}
</style>
