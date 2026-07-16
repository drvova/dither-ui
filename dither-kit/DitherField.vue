<script lang="ts">
let fieldCount = 0
</script>

<script setup lang="ts">
import { computed, provide, toRef } from "vue"
import { FIELD_CONTEXT } from "./control"
import { cssColor } from "./palette"

const props = defineProps<{ label?: string; description?: string; error?: string; for?: string }>()
const base = `dk-field-${fieldCount++}`
const controlId = computed(() => props.for ?? `${base}-control`)
const helpId = `${base}-help`
const describedBy = computed(() => props.error || props.description ? helpId : undefined)
const invalid = computed(() => !!props.error)
provide(FIELD_CONTEXT, { controlId, describedBy, invalid: toRef(invalid) })
</script>

<template>
  <div class="grid gap-1.5">
    <label v-if="props.label" :for="controlId" class="text-[12px] font-medium text-foreground/90">
      {{ props.label }}
    </label>
    <slot />
    <p
      v-if="props.error"
      :id="helpId"
      role="alert"
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
    <p v-else-if="props.description" :id="helpId" class="text-[11px] leading-relaxed text-muted-foreground">
      {{ props.description }}
    </p>
  </div>
</template>
