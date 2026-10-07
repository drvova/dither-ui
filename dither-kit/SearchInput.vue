<script setup lang="ts">
import { cn } from "./lib"
import DitherInput from "./DitherInput.vue"
import Icon from "./Icon.vue"

/** Search field: leading glyph, one-click clear (shown only when there is
 * something to clear), Escape empties the field. */
const props = defineProps<{
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  class?: string
}>()
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "clear"): void
}>()
</script>

<template>
  <div class="relative">
    <Icon
      name="Search"
      :size="14"
      class="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
    />
    <DitherInput
      v-bind="$attrs"
      type="search"
      :model-value="props.modelValue ?? ''"
      :placeholder="props.placeholder ?? 'Search…'"
      :disabled="props.disabled"
      :class="cn('pl-8 pr-8 [&::-webkit-search-cancel-button]:appearance-none', props.class)"
      @update:model-value="emit('update:modelValue', $event)"
      @keydown.esc.stop="emit('update:modelValue', ''); emit('clear')"
    />
    <button
      v-if="props.modelValue"
      type="button"
      aria-label="Clear search"
      class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      @click="emit('update:modelValue', ''); emit('clear')"
    >
      <Icon name="Close" :size="13" />
    </button>
  </div>
</template>
