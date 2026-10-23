<script setup lang="ts">
// A tool's mark (marks.ts) in currentColor. Always decorative: the tool's
// name is the text beside it. Imported by path, never through the shared/ui
// barrel: the barrel would pull every shared component (and its CSS) into
// the landing's first load.
import { MARKS, type MarkId } from "./marks"

withDefaults(defineProps<{ id: MarkId; size?: number }>(), { size: 14 })
</script>

<template>
  <svg
    :viewBox="MARKS[id].viewBox"
    :width="size"
    :height="size"
    fill="currentColor"
    :fill-rule="'evenodd' in MARKS[id] ? 'evenodd' : undefined"
    aria-hidden="true"
    focusable="false"
    class="tool-mark"
  >
    <path v-for="(d, i) in MARKS[id].d" :key="i" :d="d" />
  </svg>
</template>

<style scoped>
.tool-mark {
  flex: none;
}
</style>
