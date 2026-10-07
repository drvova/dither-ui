<script setup lang="ts">
import { ref } from "vue"

/** Hover (and keyboard focus) state as scoped-slot data — no refs, no manual
 * listeners. Focus is tracked alongside the pointer so keyboard users get the
 * same reveal, which is the whole point of exposing the state at all.
 * `class` and other attrs fall through to the block untouched. */

const hovered = ref(false)
const focused = ref(false)
</script>

<template>
  <div
    @pointerenter="hovered = true"
    @pointerleave="hovered = false"
    @focusin="focused = true"
    @focusout="focused = false"
  >
    <slot :hovered="hovered" :focused="focused" />
  </div>
</template>
