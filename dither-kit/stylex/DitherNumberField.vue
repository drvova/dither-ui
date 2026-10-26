<!-- Generated from ../tailwind/DitherNumberField.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "flex", alignItems: "center", gap: "0.5rem" },
  button: {
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--card)" } },
  },
  input: { width: "5rem", textAlign: "center", fontVariantNumeric: "   tabular-nums " },
})
</script>

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
  { step: 1, disabled: false },
)

const emit = defineEmits<{ (e: "update:modelValue", value: number): void }>()

const text = ref(String(props.modelValue))
watch(
  () => props.modelValue,
  (v) => {
    text.value = String(v)
  },
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
  <div v-bind="stylex.attrs(styles.row)">
    <button
      type="button"
      aria-label="Decrease"
      :disabled="props.disabled || atMin"
      :class="cn(CONTROL_BUTTON, styles.button)"
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
      :class="cn(CONTROL, styles.input)"
      @blur="onBlur"
      @keydown="onKeydown"
    />
    <button
      type="button"
      aria-label="Increase"
      :disabled="props.disabled || atMax"
      :class="cn(CONTROL_BUTTON, styles.button)"
      @click="set(props.modelValue + props.step)"
    >
      +
    </button>
  </div>
</template>
