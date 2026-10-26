<!-- Generated from ../tailwind/Portal.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script setup lang="ts">
/** Teleport by name: renders the slot elsewhere in the DOM (dialogs, popovers,
 * toasts escaping `overflow: hidden`). Defaults to `body`; `disabled` renders
 * in place — the SSR/no-portal switch. */
const props = withDefaults(
  defineProps<{
    to?: string
    disabled?: boolean
  }>(),
  { to: "body", disabled: false },
)
</script>

<template>
  <Teleport :to="props.to" :disabled="props.disabled"><slot /></Teleport>
</template>
