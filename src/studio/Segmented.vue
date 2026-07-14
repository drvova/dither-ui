<script setup lang="ts" generic="T extends string | number">
defineProps<{
  options: readonly T[]
  modelValue: T
  label?: string
}>()
const emit = defineEmits<{ "update:modelValue": [T] }>()
</script>

<template>
  <div class="flex items-center gap-2">
    <span
      v-if="label"
      class="w-16 shrink-0 text-[11px] text-muted-foreground"
      >{{ label }}</span
    >
    <div
      class="inline-flex rounded-md border border-border bg-background/60 p-0.5"
    >
      <button
        v-for="opt in options"
        :key="String(opt)"
        type="button"
        class="rounded-[5px] px-2 py-1 font-mono text-[11px] leading-none transition-colors"
        :class="
          opt === modelValue
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="emit('update:modelValue', opt)"
      >
        {{ opt }}
      </button>
    </div>
  </div>
</template>
