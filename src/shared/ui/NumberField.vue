<script setup lang="ts">
const props = defineProps<{
  label: string
  modelValue: number
  min?: number
  max?: number
  step?: number
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
    <span class="w-10 shrink-0">{{ label }}</span>
    <input
      type="number"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step ?? 1"
      class="w-full min-w-0 rounded-md border border-border bg-background/60 px-2 py-1 text-xs tabular-nums text-foreground outline-none [appearance:textfield] focus:border-foreground/40 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      @input="onInput"
    />
  </label>
</template>
