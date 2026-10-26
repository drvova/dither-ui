<!-- Generated from ../tailwind/DitherTooltip.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", display: "inline-block" },
  layer: {
    position: "absolute",
    bottom: "100%",
    left: "calc(1 / 2 * 100%)",
    zIndex: "30",
    marginBottom: "0.375rem",
    translate: "calc(calc(1 / 2 * 100%) * -1) 0",
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    paddingInline: "0.5rem",
    paddingBlock: "0.25rem",
    fontSize: "11px",
    whiteSpace: "nowrap",
    color: "var(--foreground)",
  },
})
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue"

const props = withDefaults(
  defineProps<{
    text: string
    delay?: number
  }>(),
  { delay: 300 },
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
    v-bind="stylex.attrs(styles.frame)"
    @pointerenter="show"
    @pointerleave="hide"
    @focusin="show"
    @focusout="hide"
    @keydown="onKeydown"
  >
    <slot />
    <Transition name="dk-tip">
      <span v-if="shown" role="tooltip" v-bind="stylex.attrs(styles.layer)">
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
