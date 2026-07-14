<script setup lang="ts">
import { computed } from "vue"
import { chartCode } from "@/entities/chart"
import { selectedChart } from "@/entities/editor"
import { CodeBlock } from "@/shared/ui"

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const code = computed(() =>
  selectedChart.value ? chartCode(selectedChart.value) : "// select an artboard"
)
</script>

<template>
  <Transition name="dk-fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      @click.self="emit('close')"
    >
      <div class="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
        <div class="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <span class="text-sm font-medium">Export — Vue SFC</span>
          <button
            type="button"
            class="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close"
            @click="emit('close')"
          >
            ×
          </button>
        </div>
        <div class="overflow-auto p-4">
          <CodeBlock :code="code" />
        </div>
      </div>
    </div>
  </Transition>
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
