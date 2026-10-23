<script setup lang="ts">
// A 16-unit stroke icon from the tools' path data.
defineProps<{ d: string; size?: number }>()
</script>

<template>
  <svg
    :width="size ?? 16"
    :height="size ?? 16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.3"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="d" />
  </svg>
</template>
