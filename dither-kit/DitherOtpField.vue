<script setup lang="ts">
import { ref, watch } from "vue"

const props = withDefaults(
  defineProps<{
    length?: number
    modelValue?: string
  }>(),
  { length: 6, modelValue: "" }
)

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "complete", code: string): void
}>()

const inputs = ref<HTMLInputElement[]>([])
const digits = ref<string[]>(
  Array.from({ length: props.length }, (_, i) => props.modelValue[i] ?? "")
)

watch(
  () => props.modelValue,
  (v) => {
    // Skip our own emit echo — joining drops empty positions, so re-parsing
    // a partial fill would shift digits leftward.
    if (v === digits.value.join("")) return
    digits.value = Array.from({ length: props.length }, (_, i) => v[i] ?? "")
  }
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
  const pasted = (event.clipboardData?.getData("text") ?? "")
    .replace(/\D/g, "")
    .slice(0, props.length)
  if (!pasted) return
  event.preventDefault()
  digits.value = Array.from({ length: props.length }, (_, i) => pasted[i] ?? "")
  inputs.value[Math.min(pasted.length, props.length - 1)]?.focus()
  commit()
}
</script>

<template>
  <div class="flex gap-2" role="group" aria-label="Verification code">
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
      class="h-11 w-9 rounded-md border border-border bg-background/60 text-center font-mono text-[13px] text-foreground outline-none transition-colors focus:border-accent/60"
      @input="onInput(i - 1, $event)"
      @keydown="onKeydown(i - 1, $event)"
      @paste="onPaste"
    />
  </div>
</template>
