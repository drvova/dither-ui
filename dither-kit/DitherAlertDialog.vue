<script setup lang="ts">
import { nextTick, ref, watch } from "vue"
import DitherButton from "./DitherButton.vue"

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

const cancelRef = ref<HTMLButtonElement | null>(null)
watch(
  () => props.open,
  (v) => {
    if (v) nextTick(() => cancelRef.value?.focus())
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition name="dk-fade">
      <div
        v-if="props.open"
        role="alertdialog"
        aria-modal="true"
        :aria-label="props.title"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
        @keydown.esc.stop="emit('cancel')"
      >
        <div class="w-full max-w-md rounded-xl border border-border bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
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
              class="rounded-md border border-border px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none"
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
</style>
