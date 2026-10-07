<script setup lang="ts">
import { cn } from "./lib"
import DitherTextarea from "./DitherTextarea.vue"

/** Code entry: monospace textarea where Tab indents (two spaces) and
 * Shift+Tab dedents the selected lines — the default browser tab trap is
 * the enemy of code fields, so it's handled here once. */
const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    rows?: number
    disabled?: boolean
    class?: string
  }>(),
  { rows: 6, placeholder: "// paste or type…" },
)
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "submit"): void
}>()

const TAB = "  "

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "Tab" && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault()
    const el = e.target as HTMLTextAreaElement
    const { value, selectionStart, selectionEnd } = el
    if (e.shiftKey) {
      const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1
      const hadTab = value.startsWith(TAB, lineStart)
      const removed = hadTab ? TAB.length : 0
      const next = value.slice(0, lineStart) + (hadTab ? value.slice(lineStart + removed) : value.slice(lineStart))
      emit("update:modelValue", next)
      requestAnimationFrame(() => {
        el.selectionStart = Math.max(lineStart, selectionStart - removed)
        el.selectionEnd = Math.max(lineStart, selectionEnd - removed)
      })
      return
    }
    const next = value.slice(0, selectionStart) + TAB + value.slice(selectionEnd)
    emit("update:modelValue", next)
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = selectionStart + TAB.length
    })
    return
  }
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    emit("submit")
  }
}
</script>

<template>
  <DitherTextarea
    v-bind="$attrs"
    :model-value="props.modelValue ?? ''"
    :placeholder="props.placeholder"
    :rows="props.rows"
    :disabled="props.disabled"
    :class="cn('font-mono text-[12.5px] leading-relaxed', props.class)"
    @update:model-value="emit('update:modelValue', $event)"
    @keydown="onKeyDown"
  />
</template>
