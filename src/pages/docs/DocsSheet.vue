<script lang="ts">
/** The sheet's id: the header key's `aria-controls` names it. */
export const SHEET_ID = "docs-sheet"
</script>

<script setup lang="ts">
import { DitherFocusScope, DitherReveal } from "@dither-kit"
import { coverPage } from "@dither-kit/engine/cover"
import { pixelPrefersReducedMotion } from "@dither-kit/engine/pixel"
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import DocsNav, { type PagePart } from "./DocsNav.vue"
import { SheetHead } from "@/widgets/site-header"
import { SEAM_HEIGHT, SHEET_WIPE } from "@/widgets/site-header/menu"
import { GROUPS } from "./groups"

/** The sections sheet: under lg, the header's sections key opens every
 * section (the parts of the one in view under its link) from anywhere on
 * the page, opened on that section. It is the site menu's kind of sheet:
 * the header standing where it stood with "Close" in the key's place, the
 * families as bands of the ink's steps under it, arriving as the kit's
 * wipe down the screen and rolling back up when it shuts. A modal: focus
 * moves in and is trapped, Escape and the close key shut it, focus returns
 * to the key; the page under it holds still. */
const props = defineProps<{ open: boolean; activeId: string; parts: PagePart[] }>()
const emit = defineEmits<{ close: []; go: [id: string]; part: [el: HTMLElement] }>()

const total = GROUPS.reduce((n, g) => n + g.items.length, 0)
const list = ref<HTMLElement | null>(null)

// The sheet stays up while it leaves: the wipe plays back over its own
// length (at once under reduced motion), then it goes. (A <Transition>
// leave would not do: it never renders the outgoing tree again, so the
// wipe would never hear it is leaving.)
const shown = ref(props.open)
const leaving = ref(false)
let gone = 0
watch(
  () => props.open,
  (open) => {
    clearTimeout(gone)
    if (open) {
      shown.value = true
      leaving.value = false
    } else if (shown.value && !pixelPrefersReducedMotion()) {
      leaving.value = true
      gone = window.setTimeout(() => {
        shown.value = false
        leaving.value = false
      }, SHEET_WIPE.duration * 1000)
    } else shown.value = false
  },
)

// The page under the sheet holds still while it is open, and the kit's
// loops on it hold their frame (the sheet covers them); both let go as the
// sheet starts to leave.
const lock = (on: boolean) => {
  document.documentElement.style.overflow = on ? "hidden" : ""
}
watch(
  () => props.open,
  async (open) => {
    lock(open)
    if (!open) {
      coverPage(null)
      return
    }
    // Open on the section in view, not at the top of 300 links.
    await nextTick()
    coverPage(document.getElementById(SHEET_ID))
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
  clearTimeout(gone)
  coverPage(null)
  wide?.removeEventListener("change", onWide)
  lock(false)
})
</script>

<template>
  <DitherFocusScope
    v-if="shown"
    :id="SHEET_ID"
    role="dialog"
    aria-modal="true"
    aria-label="Docs sections"
    class="fixed inset-0 z-50 font-mono text-foreground lg:hidden"
    @keydown.esc.stop="emit('close')"
  >
    <DitherReveal v-bind="SHEET_WIPE" :reverse="leaving" :restart-key="leaving" class="flex h-full flex-col">
      <SheetHead close-label="Close sections" @close="emit('close')">
        <span class="sheet-title"
          >Sections <span class="tabular-nums">{{ total }}</span></span
        >
      </SheetHead>
      <!-- The list starts the seam's height up, in the head's foot room, so
           the first family's seam climbs into the ground as the menu's does. -->
      <div
        ref="list"
        class="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        :style="{ marginTop: `-${SEAM_HEIGHT}px`, paddingTop: `${SEAM_HEIGHT}px` }"
      >
        <DocsNav
          :active-id="props.activeId"
          variant="sheet"
          :parts="props.parts"
          @go="emit('go', $event)"
          @part="emit('part', $event)"
        />
      </div>
    </DitherReveal>
  </DitherFocusScope>
</template>
