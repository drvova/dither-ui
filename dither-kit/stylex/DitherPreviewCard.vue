<!-- Generated from ../tailwind/DitherPreviewCard.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", display: "inline-block" },
  text: { display: "inline-block" },
  layer: {
    position: "absolute",
    bottom: "100%",
    left: "calc(1 / 2 * 100%)",
    zIndex: "30",
    marginBottom: "0.375rem",
    width: "16rem",
    translate: "calc(calc(1 / 2 * 100%) * -1) 0",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "1rem",
    boxShadow: "0 12px 40px -12px rgba(0,0,0,0.7)",
  },
})
</script>

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
  <span v-bind="stylex.attrs(styles.frame)" @keydown="onKeydown">
    <span v-bind="stylex.attrs(styles.text)" @pointerenter="show" @pointerleave="hide" @focusin="show" @focusout="hide">
      <slot name="trigger" />
    </span>
    <Transition name="dk-pop">
      <div v-if="shown" v-bind="stylex.attrs(styles.layer)" @pointerenter="keepOpen" @pointerleave="hide">
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
