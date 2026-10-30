<!-- Generated from ../tailwind/DitherOtpField.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "flex", gap: "0.5rem" },
  input: {
    height: "2.75rem",
    width: "2.25rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: { default: "var(--border)", ":focus": "var(--ring)" },
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    textAlign: "center",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--foreground)",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    outlineStyle: "none",
  },
})
</script>

<script setup lang="ts">
import { ref, watch } from "vue"

const props = withDefaults(
  defineProps<{
    length?: number
    modelValue?: string
  }>(),
  { length: 6, modelValue: "" },
)

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "complete", code: string): void
}>()

const inputs = ref<HTMLInputElement[]>([])
const digits = ref<string[]>(Array.from({ length: props.length }, (_, i) => props.modelValue[i] ?? ""))

watch(
  () => props.modelValue,
  (v) => {
    // Skip our own emit echo — joining drops empty positions, so re-parsing
    // a partial fill would shift digits leftward.
    if (v === digits.value.join("")) return
    digits.value = Array.from({ length: props.length }, (_, i) => v[i] ?? "")
  },
)

function commit() {
  const joined = digits.value.join("")
  emit("update:modelValue", joined)
  if (digits.value.every((d) => d !== "")) emit("complete", joined)
}

function onInput(i: number, event: Event) {
  const el = event.target as HTMLInputElement
  const v = el.value.replace(/\D/g, "").slice(-1)
  el.value = v
  digits.value[i] = v
  if (v && i < props.length - 1) inputs.value[i + 1]?.focus()
  commit()
}

function onKeydown(i: number, event: KeyboardEvent) {
  if (event.key === "Backspace" && !digits.value[i] && i > 0) {
    event.preventDefault()
    digits.value[i - 1] = ""
    inputs.value[i - 1]?.focus()
    commit()
  }
}

function onPaste(event: ClipboardEvent) {
  const pasted = (event.clipboardData?.getData("text") ?? "").replace(/\D/g, "").slice(0, props.length)
  if (!pasted) return
  event.preventDefault()
  digits.value = Array.from({ length: props.length }, (_, i) => pasted[i] ?? "")
  inputs.value[Math.min(pasted.length, props.length - 1)]?.focus()
  commit()
}
</script>

<template>
  <div v-bind="stylex.attrs(styles.row)" role="group" aria-label="Verification code">
    <input
      v-for="i in props.length"
      :key="i"
      ref="inputs"
      type="text"
      maxlength="1"
      inputmode="numeric"
      pattern="[0-9]*"
      autocomplete="one-time-code"
      :aria-label="`Digit ${i}`"
      :value="digits[i - 1]"
      v-bind="stylex.attrs(styles.input)"
      @input="onInput(i - 1, $event)"
      @keydown="onKeydown(i - 1, $event)"
      @paste="onPaste"
    />
  </div>
</template>
