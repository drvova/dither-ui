<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue"
import type { Artboard } from "@/entities/artboard"
import { chartCode } from "@/entities/chart"
import { editor, selectedArtboard, selectedChart } from "@/entities/editor"
import { widgetCode } from "@/entities/widget"
import { copyText, DitherFocusScope } from "@dither-kit"
import { restyle, setStyling, styling, STYLINGS } from "@/shared/lib/restyle"
import { CodeBlock, Segmented } from "@/shared/ui"

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

// The SFC in the chosen styling system: Tailwind as generated, or a scoped
// stylesheet, CSS Modules or StyleX (the kit components keep their own styles).
const codeFor = (a: Artboard) => restyle(a.widget ? widgetCode(a.widget, { w: a.w, h: a.h }) : chartCode(a.chart), styling.value)
const code = computed(() => {
  const a = selectedArtboard.value
  if (!a) return "// select an artboard"
  if (a.widget) return codeFor(a)
  return selectedChart.value ? restyle(chartCode(selectedChart.value), styling.value) : "// select an artboard"
})

const closeRef = ref<HTMLButtonElement | null>(null)
// Immediate: the dialog is mounted lazily with `open` already true, so a
// plain watch never fired and focus (and the Escape listener that rides on
// it) never reached the dialog.
watch(
  () => props.open,
  (v) => {
    if (v) nextTick(() => closeRef.value?.focus())
  },
  { immediate: true },
)

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined
async function copy() {
  copied.value = await copyText(code.value)
  clearTimeout(copyTimer)
  if (copied.value) copyTimer = setTimeout(() => (copied.value = false), 1500)
}

const fileName = (a: Artboard) =>
  `${a.name.replace(/[^\w-]+/g, "-").toLowerCase() || "artboard"}.vue`

/** Download every artboard as its own .vue file (staggered so the browser
 * accepts the download burst as one user gesture). */
async function downloadAll() {
  for (const a of editor.artboards) {
    const blob = new Blob([codeFor(a)], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName(a)
    link.click()
    URL.revokeObjectURL(url)
    await new Promise((r) => setTimeout(r, 120))
  }
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
      <DitherFocusScope :autofocus="false" class="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
        <div class="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <span class="text-sm font-medium">Export — Vue SFC</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              :title="`Download every artboard as its own .vue file (${editor.artboards.length})`"
              class="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              @click="downloadAll"
            >
              download all ({{ editor.artboards.length }})
            </button>
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
        <div class="border-b border-border/60 px-4 py-2">
          <Segmented :options="STYLINGS" :model-value="styling" label="styling" @update:model-value="setStyling" />
        </div>
        <div class="overflow-auto p-4">
          <CodeBlock :code="code" />
        </div>
      </DitherFocusScope>
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
