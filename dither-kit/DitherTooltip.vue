<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue"

const props = withDefaults(
  defineProps<{
    text: string
    delay?: number
  }>(),
  { delay: 300 }
)

const shown = ref(false)
let timer = 0

function show() {
  clearTimeout(timer)
  timer = window.setTimeout(() => {
    shown.value = true
  }, props.delay)
}
function hide() {
  clearTimeout(timer)
  shown.value = false
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") hide()
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <span
    class="relative inline-block"
    @pointerenter="show"
    @pointerleave="hide"
    @focusin="show"
    @focusout="hide"
    @keydown="onKeydown"
  >
    <slot />
    <Transition name="dk-tip">
      <span
        v-if="shown"
        role="tooltip"
        class="absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 rounded border border-border bg-card px-2 py-1 text-[11px] whitespace-nowrap text-foreground"
      >
        {{ props.text }}
      </span>
    </Transition>
  </span>
</template>

<style scoped>
.dk-tip-enter-active,
.dk-tip-leave-active {
  transition: opacity 140ms ease;
}
.dk-tip-enter-from,
.dk-tip-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .dk-tip-enter-active,
  .dk-tip-leave-active {
    transition: none;
  }
}
</style>
