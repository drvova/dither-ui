<script lang="ts">
/** The sheet's id: the header key's `aria-controls` names it. */
export const SHEET_ID = "docs-sheet"
</script>

<script setup lang="ts">
import { DitherFocusScope, DitherIcon } from "@dither-kit"
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import DocsNav, { type PagePart } from "./DocsNav.vue"
import { GROUPS } from "./groups"

/** The sections sheet: under lg, the header's sections key opens every
 * section (the parts of the one in view under its link) from anywhere on
 * the page, opened on that section. A
 * modal: focus moves in and is trapped, Escape, the backdrop and the close
 * key shut it, focus returns to the key; the page under it holds still. */
const props = defineProps<{ open: boolean; activeId: string; parts: PagePart[] }>()
const emit = defineEmits<{ close: []; go: [id: string]; part: [el: HTMLElement] }>()

const total = GROUPS.reduce((n, g) => n + g.items.length, 0)
const list = ref<HTMLElement | null>(null)

// The page under the sheet holds still while it is open.
const lock = (on: boolean) => {
  document.documentElement.style.overflow = on ? "hidden" : ""
}
watch(
  () => props.open,
  async (open) => {
    lock(open)
    if (!open) return
    // Open on the section in view, not at the top of 300 links.
    await nextTick()
    const current = list.value?.querySelector<HTMLElement>("[aria-current]")
    if (list.value && current) {
      const box = list.value.getBoundingClientRect()
      list.value.scrollTop += current.getBoundingClientRect().top - box.top - box.height / 2
    }
  },
  { immediate: true },
)

// At lg the sidebar holds the list: a sheet left open by a rotation closes.
let wide: MediaQueryList | null = null
const onWide = (e: MediaQueryListEvent) => e.matches && props.open && emit("close")
onMounted(() => {
  wide = typeof matchMedia === "function" ? matchMedia("(min-width: 1024px)") : null
  wide?.addEventListener("change", onWide)
})
onBeforeUnmount(() => {
  wide?.removeEventListener("change", onWide)
  lock(false)
})
</script>

<template>
  <Transition name="docs-sheet">
    <div
      v-if="props.open"
      class="fixed inset-x-0 top-0 z-50 h-dvh font-mono text-foreground lg:hidden"
      @keydown.esc.stop="emit('close')"
    >
      <div class="absolute inset-0 bg-background/70" aria-hidden="true" @click="emit('close')" />
      <DitherFocusScope
        :id="SHEET_ID"
        role="dialog"
        aria-modal="true"
        aria-label="Docs sections"
        class="docs-sheet-panel hardshell absolute inset-y-2 left-2 flex w-[min(20rem,calc(100%-3rem))] flex-col bg-card [--cut:12px]"
      >
        <div class="flex items-center gap-2 py-2 pr-2 pl-4 text-[12px]">
          <span class="text-foreground">Sections</span>
          <span class="spec tabular-nums">{{ total }}</span>
          <button
            type="button"
            class="ml-auto flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close sections"
            @click="emit('close')"
          >
            <DitherIcon name="Close" :size="15" :stroke-width="1.5" />
          </button>
        </div>
        <div ref="list" class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-8">
          <DocsNav
            :active-id="props.activeId"
            variant="sheet"
            :parts="props.parts"
            @go="emit('go', $event)"
            @part="emit('part', $event)"
          />
        </div>
      </DitherFocusScope>
    </div>
  </Transition>
</template>

<style scoped>
/* A panel's motion (300ms, the settle curve: a hand opened it), the sheet
   in from the left over a fading backdrop; at once under reduced motion. */
.docs-sheet-enter-active,
.docs-sheet-leave-active {
  transition: opacity 300ms var(--ease-settle);
}
.docs-sheet-enter-active .docs-sheet-panel,
.docs-sheet-leave-active .docs-sheet-panel {
  transition: transform 300ms var(--ease-settle);
}
.docs-sheet-enter-from,
.docs-sheet-leave-to {
  opacity: 0;
}
.docs-sheet-enter-from .docs-sheet-panel,
.docs-sheet-leave-to .docs-sheet-panel {
  transform: translateX(-24px);
}
@media (prefers-reduced-motion: reduce) {
  .docs-sheet-enter-active,
  .docs-sheet-leave-active,
  .docs-sheet-enter-active .docs-sheet-panel,
  .docs-sheet-leave-active .docs-sheet-panel {
    transition: none;
  }
}
</style>
