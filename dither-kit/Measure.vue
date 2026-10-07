<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"

/** Reports its own box size: renders the slot in a plain block and emits
 * `resize` with `{ width, height }` whenever the box changes (first
 * observation included). ResizeObserver-only — without it (jsdom, ancient
 * engines) it simply renders and stays silent rather than guessing. `class`
 * and other attrs fall through to the block untouched. */
const emit = defineEmits<{ resize: [{ width: number; height: number }] }>()
const root = ref<HTMLElement | null>(null)
let ro: ResizeObserver | null = null

onMounted(() => {
  if (typeof ResizeObserver === "undefined" || !root.value) return
  ro = new ResizeObserver((entries) => {
    for (const e of entries) {
      emit("resize", { width: Math.round(e.contentRect.width), height: Math.round(e.contentRect.height) })
    }
  })
  ro.observe(root.value)
})
onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
})
</script>

<template>
  <div ref="root"><slot /></div>
</template>
