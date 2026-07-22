<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue"
import { CONTROL_BUTTON } from "./control"
import { cn } from "./lib"

const props = withDefaults(defineProps<{
  open: boolean
  label?: string
  closeOnBackdrop?: boolean
  class?: string
}>(), { label: "Modal", closeOnBackdrop: true })
const emit = defineEmits<{ close: [] }>()
const panelRef = ref<HTMLElement | null>(null)
const closeRef = ref<HTMLButtonElement | null>(null)
let previousFocus: HTMLElement | null = null

const focusable = () => [...(panelRef.value?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])]
function focusInitial() { closeRef.value?.focus() ?? focusable()[0]?.focus() }
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") { e.stopPropagation(); emit("close"); return }
  if (e.key !== "Tab") return
  const items = focusable()
  if (!items.length) return e.preventDefault()
  const first = items[0], last = items[items.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}
watch(() => props.open, (open) => {
  if (open) { previousFocus = document.activeElement as HTMLElement | null; nextTick(focusInitial) }
  else { const restore = previousFocus; previousFocus = null; nextTick(() => restore?.focus()) }
}, { immediate: true })
onBeforeUnmount(() => previousFocus?.focus())
</script>

<template>
  <Teleport to="body">
    <Transition name="dk-cmm">
      <div
        v-if="props.open"
        class="fixed inset-0 z-50 bg-black/65 p-4 sm:p-6"
        @pointerdown.self="props.closeOnBackdrop && emit('close')"
        @keydown="onKeydown"
      >
        <section
          ref="panelRef"
          role="dialog"
          aria-modal="true"
          :aria-label="props.label"
          :class="cn('dk-cmm-panel relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]', props.class)"
        >
          <button ref="closeRef" type="button" :class="cn(CONTROL_BUTTON, 'absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-md border border-border/70 bg-background/85 text-muted-foreground transition-colors hover:bg-background hover:text-foreground')" aria-label="Close" @click="emit('close')">×</button>
          <div class="min-h-0 flex-1 overflow-auto p-6"><slot /></div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dk-cmm-enter-active { transition: opacity 480ms cubic-bezier(0.76, 0, 0.24, 1); }
.dk-cmm-leave-active { transition: opacity 220ms ease 200ms; }
.dk-cmm-enter-from, .dk-cmm-leave-to { opacity: 0; }
.dk-cmm-enter-active .dk-cmm-panel { animation: dk-cmm-unfold 480ms cubic-bezier(0.76, 0, 0.24, 1) both; }
.dk-cmm-leave-active .dk-cmm-panel { animation: dk-cmm-unfold 400ms cubic-bezier(0.76, 0, 0.24, 1) reverse both; }
@keyframes dk-cmm-unfold {
  0% { clip-path: inset(50% round 0.75rem); }
  46% { clip-path: inset(calc(50% - 1px) 0 round 0.75rem); }
  100% { clip-path: inset(0 round 0.75rem); }
}
@media (prefers-reduced-motion: reduce) {
  .dk-cmm-enter-active, .dk-cmm-leave-active { transition: none; }
  .dk-cmm-enter-active .dk-cmm-panel, .dk-cmm-leave-active .dk-cmm-panel { animation: none; }
}
</style>
