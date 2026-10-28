<!-- Generated from ../tailwind/PasswordInput.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative" },
  input: { paddingRight: "2.25rem" },
  button: {
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    right: "0.375rem",
    translate: "0 calc(calc(1 / 2 * 100%) * -1)",
    borderRadius: "0.25rem",
    padding: "0.375rem",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
})
</script>

<script setup lang="ts">
import { ref } from "vue"
import { type StyleProp } from "./lib"
import DitherInput from "./DitherInput.vue"
import Icon from "./Icon.vue"

/** Password field with a reveal toggle: type flips text/password, the button
 * carries the accessible name and never submits (type=button). */
const props = defineProps<{
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  class?: string
  xstyle?: StyleProp
}>()
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()

const shown = ref(false)
</script>

<template>
  <div v-bind="stylex.attrs(styles.frame)">
    <DitherInput
      v-bind="$attrs"
      :model-value="props.modelValue ?? ''"
      :type="shown ? 'text' : 'password'"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :invalid="props.invalid"
      :xstyle="[styles.input, props.xstyle, props.class]"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <button
      type="button"
      :aria-label="shown ? 'Hide password' : 'Show password'"
      :aria-pressed="shown"
      v-bind="stylex.attrs(styles.button)"
      @click="shown = !shown"
    >
      <Icon :name="shown ? 'EyeOff' : 'Eye'" :size="14" />
    </button>
  </div>
</template>
