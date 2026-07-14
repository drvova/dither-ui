<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue"

const props = withDefaults(
  defineProps<{
    open: boolean
    align?: "start" | "center" | "end"
  }>(),
  { align: "start" }
)
const emit = defineEmits<{ close: [] }>()

const ALIGN: Record<string, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
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
  }
)
onBeforeUnmount(() => {
  clearTimeout(timer)
  window.removeEventListener("pointerdown", onOutside)
  window.removeEventListener("keydown", onKey)
})
</script>

<template>
  <div ref="rootRef" class="relative inline-block">
    <slot name="trigger" />
    <Transition name="dk-pop">
      <div
        v-if="props.open"
        class="absolute top-full z-30 mt-1.5 min-w-[180px] rounded-lg border border-border bg-card p-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]"
        :class="ALIGN[props.align]"
      >
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
