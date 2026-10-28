<script setup lang="ts">
import { cn } from "./lib"
import DitherInput from "./DitherInput.vue"

/** Shortcut capture: the field listens, modifiers hold until a non-modifier
 * arrives, Escape clears. Value shape: `Ctrl+Shift+K` (order Ctrl, Alt,
 * Shift, Meta + normalized key). Repeat keys are ignored so holding a combo
 * doesn't re-fire. */
const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    disabled?: boolean
    class?: string
  }>(),
  { placeholder: "Press a shortcut…" },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()

const MODIFIERS = new Set(["Control", "Shift", "Alt", "Meta", "CapsLock", "OS"])

function normalizeKey(key: string): string {
  if (key === " ") return "Space"
  if (key.length === 1) return key.toUpperCase()
  return key
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  if (e.key === "Escape") {
    e.preventDefault()
    emit("update:modelValue", "")
    return
  }
  if (MODIFIERS.has(e.key) || e.repeat) {
    e.preventDefault()
    return
  }
  e.preventDefault()
  const parts: string[] = []
  if (e.ctrlKey) parts.push("Ctrl")
  if (e.altKey) parts.push("Alt")
  if (e.shiftKey) parts.push("Shift")
  if (e.metaKey) parts.push("Meta")
  parts.push(normalizeKey(e.key))
  emit("update:modelValue", parts.join("+"))
}
</script>

<template>
  <DitherInput
    v-bind="$attrs"
    readonly
    :model-value="props.modelValue ?? ''"
    :placeholder="props.modelValue ? '' : props.placeholder"
    :disabled="props.disabled"
    :class="cn('cursor-default', props.class)"
    @keydown="onKeydown"
  />
</template>
