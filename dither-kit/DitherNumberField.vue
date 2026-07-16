<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { CONTROL, CONTROL_BUTTON } from "./control"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    disabled?: boolean
  }>(),
  { step: 1, disabled: false }
)

const emit = defineEmits<{ (e: "update:modelValue", value: number): void }>()

const text = ref(String(props.modelValue))
watch(
  () => props.modelValue,
  (v) => {
    text.value = String(v)
  }
)

const atMin = computed(() => props.min !== undefined && props.modelValue <= props.min)
const atMax = computed(() => props.max !== undefined && props.modelValue >= props.max)

function clampStep(raw: number): number {
  const base = props.min ?? 0
  let v = base + Math.round((raw - base) / props.step) * props.step
  if (props.min !== undefined) v = Math.max(props.min, v)
  if (props.max !== undefined) v = Math.min(props.max, v)
  return v
}

function set(raw: number) {
  const next = clampStep(raw)
  emit("update:modelValue", next)
  text.value = String(next)
}

function onBlur() {
  const parsed = Number.parseFloat(text.value)
  if (Number.isNaN(parsed)) {
    text.value = String(props.modelValue)
    return
  }
  set(parsed)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowUp") {
    event.preventDefault()
    set(props.modelValue + props.step)
  } else if (event.key === "ArrowDown") {
    event.preventDefault()
    set(props.modelValue - props.step)
  }
}
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      type="button"
      aria-label="Decrease"
      :disabled="props.disabled || atMin"
      :class="cn(CONTROL_BUTTON, 'size-10 rounded-md border border-border text-muted-foreground transition-colors hover:bg-card hover:text-foreground')"
      @click="set(props.modelValue - props.step)"
    >
      -
    </button>
    <input
      v-model="text"
      type="text"
      inputmode="numeric"
      role="spinbutton"
      :aria-valuenow="props.modelValue"
      :aria-valuemin="props.min"
      :aria-valuemax="props.max"
      :disabled="props.disabled"
      :class="cn(CONTROL, 'w-20 text-center tabular-nums')"
      @blur="onBlur"
      @keydown="onKeydown"
    />
    <button
      type="button"
      aria-label="Increase"
      :disabled="props.disabled || atMax"
      :class="cn(CONTROL_BUTTON, 'size-10 rounded-md border border-border text-muted-foreground transition-colors hover:bg-card hover:text-foreground')"
      @click="set(props.modelValue + props.step)"
    >
      +
    </button>
  </div>
</template>
