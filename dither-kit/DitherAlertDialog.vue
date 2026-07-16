<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue"
import DitherButton from "./DitherButton.vue"
import { CONTROL_BUTTON } from "./control"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
  }>(),
  { confirmLabel: "Confirm", cancelLabel: "Cancel", danger: false }
)
const emit = defineEmits<{ confirm: []; cancel: [] }>()

const panelRef = ref<HTMLElement | null>(null)
const cancelRef = ref<HTMLButtonElement | null>(null)
let previousFocus: HTMLElement | null = null
const focusable = () => [...(panelRef.value?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])]
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") { e.stopPropagation(); emit("cancel"); return }
  if (e.key !== "Tab") return
  const items = focusable(), first = items[0], last = items[items.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
}
watch(() => props.open, (open) => {
  if (open) { previousFocus = document.activeElement as HTMLElement | null; nextTick(() => cancelRef.value?.focus()) }
  else { const restore = previousFocus; previousFocus = null; nextTick(() => restore?.focus()) }
}, { immediate: true })
onBeforeUnmount(() => previousFocus?.focus())
</script>

<template>
  <Teleport to="body">
    <Transition name="dk-fade">
      <div
        v-if="props.open"
        role="alertdialog"
        aria-modal="true"
        :aria-label="props.title"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-6"
        @pointerdown.self="emit('cancel')"
        @keydown="onKeydown"
      >
        <div ref="panelRef" class="w-full max-w-md rounded-xl border border-border/80 bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
          <div class="px-4 pt-4">
            <span class="text-sm font-medium">{{ props.title }}</span>
            <p
              v-if="props.description"
              class="mt-2 text-[13px] leading-relaxed text-muted-foreground"
            >
              {{ props.description }}
            </p>
          </div>
          <div class="flex justify-end gap-2 p-4">
            <button
              ref="cancelRef"
              type="button"
              :class="cn(CONTROL_BUTTON, 'min-h-10 rounded-md border border-border px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:bg-background hover:text-foreground')"
              @click="emit('cancel')"
            >
              {{ props.cancelLabel }}
            </button>
            <DitherButton :color="props.danger ? 'red' : 'blue'" @click="emit('confirm')">
              {{ props.confirmLabel }}
            </DitherButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dk-fade-enter-active,
.dk-fade-leave-active {
  transition: opacity 160ms ease;
}
.dk-fade-enter-from,
.dk-fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
.dk-fade-enter-active, .dk-fade-leave-active { transition: none; }
}
</style>
