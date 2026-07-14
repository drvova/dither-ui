<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue"
import { chartCode } from "@/entities/chart"
import { selectedChart } from "@/entities/editor"
import { CodeBlock } from "@/shared/ui"

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const code = computed(() =>
  selectedChart.value ? chartCode(selectedChart.value) : "// select an artboard"
)

const closeRef = ref<HTMLButtonElement | null>(null)
watch(
  () => props.open,
  (v) => {
    if (v) nextTick(() => closeRef.value?.focus())
  }
)

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined
async function copy() {
  await navigator.clipboard.writeText(code.value)
  copied.value = true
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <Transition name="dk-fade">
    <div
      v-if="open"
      role="dialog"
      aria-modal="true"
      aria-label="Export code"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      @click.self="emit('close')"
      @keydown.esc.stop="emit('close')"
    >
      <div class="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
        <div class="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <span class="text-sm font-medium">Export — Vue SFC</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-md border border-border px-2.5 py-1 text-[11px] transition-colors"
              :class="copied ? 'text-accent' : 'text-muted-foreground hover:text-foreground'"
              @click="copy"
            >
              {{ copied ? "copied" : "copy" }}
            </button>
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
