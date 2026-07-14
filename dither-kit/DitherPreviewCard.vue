<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue"

const props = withDefaults(defineProps<{ delay?: number }>(), { delay: 400 })

const shown = ref(false)
let openTimer = 0
let closeTimer = 0

function show() {
  clearTimeout(closeTimer)
  clearTimeout(openTimer)
  openTimer = window.setTimeout(() => {
    shown.value = true
  }, props.delay)
}
function hide() {
  clearTimeout(openTimer)
  clearTimeout(closeTimer)
  // small close-delay so moving the pointer into the card keeps it open
  closeTimer = window.setTimeout(() => {
    shown.value = false
  }, 100)
}
function keepOpen() {
  clearTimeout(closeTimer)
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    clearTimeout(openTimer)
    clearTimeout(closeTimer)
    shown.value = false
  }
}

onBeforeUnmount(() => {
  clearTimeout(openTimer)
  clearTimeout(closeTimer)
})
</script>

<template>
  <span class="relative inline-block" @keydown="onKeydown">
    <span
      class="inline-block"
      @pointerenter="show"
      @pointerleave="hide"
      @focusin="show"
      @focusout="hide"
    >
      <slot name="trigger" />
    </span>
    <Transition name="dk-pop">
      <div
        v-if="shown"
        class="absolute bottom-full left-1/2 z-30 mb-1.5 w-64 -translate-x-1/2 rounded-lg border border-border bg-card p-4 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]"
        @pointerenter="keepOpen"
        @pointerleave="hide"
      >
        <slot />
      </div>
    </Transition>
  </span>
</template>

<style scoped>
.dk-pop-enter-active,
.dk-pop-leave-active {
  transition:
    opacity 140ms ease,
    transform 140ms ease;
}
.dk-pop-enter-from,
.dk-pop-leave-to {
  opacity: 0;
  transform: translateY(2px);
}
@media (prefers-reduced-motion: reduce) {
  .dk-pop-enter-active,
  .dk-pop-leave-active {
    transition: none;
  }
}
</style>
