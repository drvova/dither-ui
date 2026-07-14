<script setup lang="ts">
import { cssColor } from "./palette"

const props = defineProps<{
  label?: string
  description?: string
  error?: string
  for?: string
}>()
</script>

<template>
  <div class="grid gap-1.5">
    <label v-if="props.label" :for="props.for" class="text-[12px] text-foreground/90">
      {{ props.label }}
    </label>
    <slot />
    <p
      v-if="props.error"
      class="flex items-center gap-1.5 text-[11px]"
      :style="{ color: cssColor('red') }"
    >
      <span
        aria-hidden="true"
        class="inline-block size-1.5"
        :style="{ background: cssColor('red') }"
      />
      {{ props.error }}
    </p>
    <p v-else-if="props.description" class="text-[11px] text-muted-foreground">
      {{ props.description }}
    </p>
  </div>
</template>
