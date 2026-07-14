<script setup lang="ts">
import { nextTick, ref, watch } from "vue"

const props = withDefaults(
  defineProps<{
    open: boolean
    side?: "right" | "left"
    title?: string
  }>(),
  { side: "right" }
)
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
        aria-hidden="true"
        class="fixed inset-0 z-50 bg-black/60"
        @click="emit('close')"
      />
    </Transition>
    <Transition :name="props.side === 'right' ? 'dk-slide-r' : 'dk-slide-l'">
      <div
        v-if="props.open"
        role="dialog"
        aria-modal="true"
        :aria-label="props.title"
        class="fixed inset-y-0 z-50 flex w-80 max-w-[85vw] flex-col border-border bg-card p-4"
        :class="props.side === 'right' ? 'right-0 border-l' : 'left-0 border-r'"
        @keydown.esc.stop="emit('close')"
      >
        <div class="flex items-center justify-between gap-2 pb-3">
          <span class="text-sm font-medium">{{ props.title }}</span>
          <button
            ref="closeRef"
            type="button"
            class="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none"
            aria-label="Close"
            @click="emit('close')"
          >
            ×
          </button>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dk-fade-enter-active,
.dk-fade-leave-active {
  transition: opacity 200ms ease;
}
.dk-fade-enter-from,
.dk-fade-leave-to {
  opacity: 0;
}
.dk-slide-r-enter-active,
.dk-slide-r-leave-active,
.dk-slide-l-enter-active,
.dk-slide-l-leave-active {
  transition: transform 200ms ease;
}
.dk-slide-r-enter-from,
.dk-slide-r-leave-to {
  transform: translateX(100%);
}
.dk-slide-l-enter-from,
.dk-slide-l-leave-to {
  transform: translateX(-100%);
}
@media (prefers-reduced-motion: reduce) {
  .dk-fade-enter-active,
  .dk-fade-leave-active,
  .dk-slide-r-enter-active,
  .dk-slide-r-leave-active,
  .dk-slide-l-enter-active,
  .dk-slide-l-leave-active {
    transition: none;
  }
}
</style>
