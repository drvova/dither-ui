<script setup lang="ts">
import { COLORS } from "@/shared/config"
import type { DitherColor } from "@/shared/dither-kit"

defineProps<{ modelValue: DitherColor; label?: string }>()
const emit = defineEmits<{ "update:modelValue": [DitherColor] }>()
</script>

<template>
  <div class="flex items-center gap-2">
    <span v-if="label" class="w-14 shrink-0 text-[11px] text-muted-foreground">{{ label }}</span>
    <div class="flex flex-wrap gap-1">
      <button
        v-for="c in COLORS"
        :key="c"
        type="button"
        class="size-5 rounded-[4px] border transition-transform hover:scale-110"
        :class="modelValue === c ? 'border-foreground' : 'border-border'"
        :style="{ backgroundColor: `var(--swatch-${c})` }"
        :title="c"
        :aria-label="c"
        @click="emit('update:modelValue', c)"
      />
    </div>
  </div>
</template>
