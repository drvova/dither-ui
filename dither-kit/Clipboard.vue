<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue"

/** Click-to-copy around any trigger content. The scoped slot gets
 * `{ copied, copy }` so the trigger can render its own feedback, and a polite
 * aria-live region announces the result for screen readers. The default slot
 * content should be a real control (button/link) — this wrapper adds the
 * clipboard behavior and the announcement, not the semantics. */
const props = withDefaults(
  defineProps<{
    value: string
    disabled?: boolean
  }>(),
  { disabled: false },
)

const emit = defineEmits<{ copied: [value: string] }>()
const copied = ref(false)
let timer = 0

async function copy() {
  if (props.disabled) return
  try {
    await navigator.clipboard.writeText(props.value)
    copied.value = true
    emit("copied", props.value)
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    copied.value = false
  }
}

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <div
    class="contents"
    @click="copy"
  >
    <slot :copied="copied" :copy="copy" />
    <span class="sr-only" role="status" aria-live="polite">{{ copied ? "Copied to clipboard" : "" }}</span>
  </div>
</template>
