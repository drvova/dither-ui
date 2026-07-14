<script setup lang="ts">
const props = defineProps<{
  label: string
  modelValue: number
  min?: number
  max?: number
  step?: number
  unit?: string
}>()
const emit = defineEmits<{ "update:modelValue": [number] }>()

function onInput(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  let n = Number.isFinite(v) ? v : 0
  if (props.min != null) n = Math.max(props.min, n)
  if (props.max != null) n = Math.min(props.max, n)
  emit("update:modelValue", n)
}
</script>

<template>
  <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
    <span class="w-11 shrink-0 whitespace-nowrap">{{ label }}</span>
    <span class="relative flex-1">
      <input
        type="number"
        :name="label"
        autocomplete="off"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step ?? 1"
        class="w-full min-w-0 rounded-md border border-border bg-background/60 px-2 py-1 text-xs tabular-nums text-foreground outline-none [appearance:textfield] focus:border-accent/60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        :class="unit ? 'pr-6' : ''"
        @input="onInput"
      />
      <span v-if="unit" class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{{ unit }}</span>
    </span>
  </label>
</template>
