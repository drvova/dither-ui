<script setup lang="ts">
import { nextTick, ref, watch } from "vue"

const props = defineProps<{ open: boolean; title?: string }>()
const emit = defineEmits<{ close: [] }>()

const closeRef = ref<HTMLButtonElement | null>(null)
watch(
  () => props.open,
  (v) => {
    if (v) nextTick(() => closeRef.value?.focus())
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition name="dk-fade">
      <div
        v-if="props.open"
        role="dialog"
        aria-modal="true"
        :aria-label="props.title"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
        @click.self="emit('close')"
        @keydown.esc.stop="emit('close')"
      >
        <div class="w-full max-w-md rounded-xl border border-border bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
          <div class="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <span class="text-sm font-medium">{{ props.title }}</span>
            <button
              ref="closeRef"
              type="button"
              class="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close"
              @click="emit('close')"
            >
              ×
            </button>
          </div>
          <div class="p-4"><slot /></div>
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
