<script setup lang="ts" generic="T extends string | number">
// `labels` names an option where its value is not how a reader writes it
// (a styling system's proper name); unnamed options show their value.
defineProps<{
  options: readonly T[]
  modelValue: T
  label?: string
  labels?: Partial<Record<string, string>>
}>()
const emit = defineEmits<{ "update:modelValue": [T] }>()
</script>

<template>
  <div class="flex items-center gap-2">
    <span v-if="label" class="w-14 shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">{{ label }}</span>
    <div class="flex flex-1 flex-wrap rounded-md border border-border bg-background/60 p-0.5">
      <button
        v-for="opt in options"
        :key="String(opt)"
        type="button"
        :aria-pressed="opt === modelValue"
        class="min-h-6 rounded-[5px] px-2 text-[11px] leading-none transition-colors"
        :class="opt === modelValue ? 'ring-on' : 'text-muted-foreground hover:text-foreground'"
        @click="emit('update:modelValue', opt)"
      >
        {{ labels?.[String(opt)] ?? opt }}
      </button>
    </div>
  </div>
</template>
