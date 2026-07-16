<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue"
import { CONTROL_BUTTON } from "./control"
import { cn } from "./lib"

let dialogCount = 0
const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  description?: string
  closeOnBackdrop?: boolean
  class?: string
}>(), { closeOnBackdrop: true })
const emit = defineEmits<{ close: [] }>()
const panelRef = ref<HTMLElement | null>(null)
const closeRef = ref<HTMLButtonElement | null>(null)
const idBase = `dk-dialog-${dialogCount++}`
const titleId = `${idBase}-title`
const descriptionId = `${idBase}-description`
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
    <Transition name="dk-dialog">
      <div
        v-if="props.open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-6"
        @pointerdown.self="props.closeOnBackdrop && emit('close')"
        @keydown="onKeydown"
      >
        <section
          ref="panelRef"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="props.title ? titleId : undefined"
          :aria-label="props.title ? undefined : 'Dialog'"
          :aria-describedby="props.description ? descriptionId : undefined"
          :class="cn('w-full max-w-md overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]', props.class)"
        >
          <header class="flex min-h-12 items-start justify-between gap-4 border-b border-border/60 px-4 py-3">
            <div class="min-w-0">
              <h2 v-if="props.title" :id="titleId" class="text-sm font-medium text-foreground">{{ props.title }}</h2>
              <p v-if="props.description" :id="descriptionId" class="mt-1 text-[12px] leading-relaxed text-muted-foreground">{{ props.description }}</p>
            </div>
            <button ref="closeRef" type="button" :class="cn(CONTROL_BUTTON, 'flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground')" aria-label="Close" @click="emit('close')">×</button>
          </header>
          <div class="p-4"><slot /></div>
          <footer v-if="$slots.footer" class="flex justify-end gap-2 border-t border-border/60 px-4 py-3"><slot name="footer" /></footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dk-dialog-enter-active, .dk-dialog-leave-active { transition: opacity 160ms ease; }
.dk-dialog-enter-active section, .dk-dialog-leave-active section { transition: transform 180ms cubic-bezier(0.2, 0, 0, 1), opacity 120ms ease; }
.dk-dialog-enter-from, .dk-dialog-leave-to { opacity: 0; }
.dk-dialog-enter-from section, .dk-dialog-leave-to section { transform: translateY(8px) scale(0.98); opacity: 0; }
@media (prefers-reduced-motion: reduce) { .dk-dialog-enter-active, .dk-dialog-leave-active, .dk-dialog-enter-active section, .dk-dialog-leave-active section { transition: none; } }
</style>
