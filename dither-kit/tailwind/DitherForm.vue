<script setup lang="ts">
// Semantics only: a <form> that suppresses the native validation UI and
// exposes a clean submit event.
const emit = defineEmits<{ (e: "submit"): void }>()
</script>

<template>
  <form novalidate @submit.prevent="emit('submit')">
    <slot />
  </form>
</template>
