<script setup lang="ts">
defineProps<{ modelValue: boolean; label: string }>()
const emit = defineEmits<{ "update:modelValue": [boolean] }>()
</script>

<template>
  <label class="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
    <input
      type="checkbox"
      :checked="modelValue"
      class="accent-foreground"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    {{ label }}
  </label>
</template>
