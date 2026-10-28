<!-- Generated from ../tailwind/DitherForm.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
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
