<!-- Generated from ../tailwind/DitherPopover.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", display: "inline-block" },
  layer: {
    position: "absolute",
    top: "100%",
    zIndex: "30",
    marginTop: "0.375rem",
    minWidth: "180px",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "0.75rem",
    boxShadow: "0 12px 40px -12px rgba(0,0,0,0.7)",
  },
  alignStart: { left: "0px" },
  alignCenter: { left: "calc(1 / 2 * 100%)", translate: "calc(calc(1 / 2 * 100%) * -1) 0" },
  alignEnd: { right: "0px" },
})
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue"
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    open: boolean
    align?: "start" | "center" | "end"
  }>(),
  { align: "start" },
)
const emit = defineEmits<{ close: [] }>()

const ALIGN: Record<string, StyleProp> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
}

const rootRef = ref<HTMLDivElement | null>(null)

function onOutside(e: PointerEvent) {
  if (rootRef.value?.contains(e.target as Node)) return
  emit("close")
}
function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close")
}

let timer = 0
watch(
  () => props.open,
  (v) => {
    if (v) {
      // defer so the opening click doesn't immediately close it
      timer = window.setTimeout(() => {
        window.addEventListener("pointerdown", onOutside)
        window.addEventListener("keydown", onKey)
      }, 0)
    } else {
      clearTimeout(timer)
      window.removeEventListener("pointerdown", onOutside)
      window.removeEventListener("keydown", onKey)
    }
  },
)
onBeforeUnmount(() => {
  clearTimeout(timer)
  window.removeEventListener("pointerdown", onOutside)
  window.removeEventListener("keydown", onKey)
})
</script>

<template>
  <div ref="rootRef" v-bind="stylex.attrs(styles.frame)">
    <slot name="trigger" />
    <Transition name="dk-pop">
      <div v-if="props.open" :class="cn(styles.layer, ALIGN[props.align])">
        <slot />
      </div>
    </Transition>
  </div>
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
