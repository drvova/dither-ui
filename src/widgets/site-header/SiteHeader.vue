<script setup lang="ts">
// The site's header, one for every page that reads (the landing, the docs):
// a capsule on the raised ground floating over the page, centred, lifted by
// its shadow alone; the brand, the site's links (GitHub under its mark), a
// page's own tools (`tools`: the docs' search and sections key) and the
// chrome "Open studio" key. Under lg the links the capsule has no room for
// live in the menu (`menu.ts`): its key, the sheet's bands in miniature,
// opens them as a modal sheet of tone steps that wipes in and rolls back up
// when it is closed. Sticky is positioned, and z-40 keeps it over a page's
// main, which isolates its art.
import { DitherReveal } from "@dither-kit"
import { coverPage } from "@dither-kit/engine/cover"
import { pixelPrefersReducedMotion } from "@dither-kit/engine/pixel"
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue"
import { routePath } from "@/shared/lib"
import BrandMark from "@/shared/ui/BrandMark.vue"
import ToolMark from "@/shared/ui/ToolMark.vue"
import "./site-header.css"
import SheetHead from "./SheetHead.vue"
import {
  BAND_INK,
  MENU_LINKS,
  MENU_WIDE,
  SHEET_WIPE,
  STUDIO_FILL,
  STUDIO_LINK,
  bandFill,
  seamStyle,
  type MenuLinkId,
  type MenuPhase,
} from "./menu"

/** The page the reader is on, so its own link reads as current. */
const props = defineProps<{ current: "landing" | "docs" }>()
const home = routePath("/")
const MENU_ID = "site-menu"

/** Where each link goes on this site. */
const HREF: Record<MenuLinkId, string> = {
  components: `${home}#examples`,
  docs: routePath("/docs"),
  agents: `${home}#ask`,
  github: "https://github.com/drvova/dither-ui",
}
const STUDIO = routePath("/studio")
const SHOWN = { md: "hidden md:inline-flex", lg: "hidden lg:inline-flex" } as const
const isCurrent = (id: MenuLinkId) => id === props.current
const external = (id: MenuLinkId) => id === "github"

// The menu: a native modal dialog (focus held inside, Escape closes, the page
// inert under it), the page holding still while it is open.
const phase = ref<MenuPhase>("shut")
const sheet = ref<HTMLDialogElement | null>(null)
const key = ref<HTMLButtonElement | null>(null)
let leaving = 0
const lock = (on: boolean) => {
  document.documentElement.style.overflow = on ? "hidden" : ""
}
async function show() {
  clearTimeout(leaving)
  phase.value = "open"
  lock(true)
  await nextTick()
  if (!sheet.value?.open) sheet.value?.showModal?.()
  // The sheet covers the page: the kit's loops under it hold their frame.
  coverPage(sheet.value)
}
/** Shut at once: a link taken (the page is moving on), the window grown. */
function shut() {
  clearTimeout(leaving)
  if (phase.value === "shut") return
  phase.value = "shut"
  coverPage(null)
  lock(false)
  if (sheet.value?.open) sheet.value.close()
  key.value?.focus()
}
/** Shut as it came: the wipe played back, the sheet rolling up from its foot. */
function leave() {
  if (phase.value !== "open") return
  if (pixelPrefersReducedMotion()) return shut()
  phase.value = "leaving"
  // The page wakes as the sheet rolls up off it.
  coverPage(null)
  leaving = window.setTimeout(shut, SHEET_WIPE.duration * 1000)
}
// Escape asks the dialog to cancel: it leaves the same way the close key does.
function onCancel(e: Event) {
  e.preventDefault()
  leave()
}

// From lg the capsule holds every link: a menu left open by a rotation closes.
let wide: MediaQueryList | null = null
const onWide = (e: MediaQueryListEvent) => e.matches && shut()
onMounted(() => {
  wide = typeof matchMedia === "function" ? matchMedia(`(min-width: ${MENU_WIDE}px)`) : null
  wide?.addEventListener("change", onWide)
})
onBeforeUnmount(() => {
  wide?.removeEventListener("change", onWide)
  clearTimeout(leaving)
  if (phase.value !== "shut") {
    lock(false)
    coverPage(null)
  }
})
</script>

<template>
  <header class="site-head sticky top-0 z-40">
    <div class="site-capsule text-xs">
      <a :href="home" class="flex h-8 items-center gap-2.5 whitespace-nowrap pl-2">
        <BrandMark :size="13" />
        <span class="max-[359px]:sr-only">dither-ui</span>
      </a>
      <nav class="flex items-center text-muted-foreground" aria-label="Site">
        <a
          v-for="l in MENU_LINKS"
          :key="l.id"
          :href="HREF[l.id]"
          class="nav-a"
          :class="[SHOWN[l.from], { 'text-foreground': isCurrent(l.id) }]"
          :aria-current="isCurrent(l.id) ? 'page' : undefined"
          :target="external(l.id) ? '_blank' : undefined"
          :rel="external(l.id) ? 'noreferrer' : undefined"
          ><ToolMark v-if="external(l.id)" id="github" :size="13" />{{ l.label
          }}<span v-if="external(l.id)" class="sr-only"> (opens in a new tab)</span></a
        >
      </nav>
      <div class="flex items-center gap-1">
        <slot name="tools" />
        <a :href="STUDIO" class="nav-a key-chrome studio-key hidden md:inline-flex">{{ STUDIO_LINK.label }}</a>
        <button
          ref="key"
          type="button"
          class="nav-a menu-key lg:hidden"
          aria-haspopup="dialog"
          :aria-expanded="phase === 'open'"
          :aria-controls="MENU_ID"
          @click="show"
        >
          <span class="menu-chip" aria-hidden="true">
            <span v-for="(_, i) in BAND_INK" :key="i" :style="{ background: bandFill(i) }" />
            <span :style="{ background: STUDIO_FILL }" />
          </span>
          <span class="max-[359px]:sr-only">Menu</span>
        </button>
      </div>
    </div>
  </header>

  <dialog :id="MENU_ID" ref="sheet" class="site-menu" aria-label="Site menu" @cancel="onCancel" @close="shut">
    <DitherReveal
      v-if="phase !== 'shut'"
      v-bind="SHEET_WIPE"
      :reverse="phase === 'leaving'"
      :restart-key="phase"
      class="menu-sheet"
      :data-phase="phase"
    >
      <SheetHead close-label="Close menu" @close="leave" />
      <nav class="menu-bands" aria-label="Site">
        <a
          v-for="(l, i) in MENU_LINKS"
          :key="l.id"
          :href="HREF[l.id]"
          class="menu-band"
          :style="{ background: bandFill(i) }"
          :aria-current="isCurrent(l.id) ? 'page' : undefined"
          :target="external(l.id) ? '_blank' : undefined"
          :rel="external(l.id) ? 'noreferrer' : undefined"
          @click="shut"
        >
          <span class="menu-seam" :style="seamStyle(bandFill(i))" aria-hidden="true" />
          <span class="menu-name"
            ><ToolMark v-if="external(l.id)" id="github" :size="18" />{{ l.label
            }}<span v-if="external(l.id)" class="sr-only"> (opens in a new tab)</span></span
          >
          <span class="menu-note">{{ l.note }}</span>
        </a>
        <a :href="STUDIO" class="menu-band" :style="{ background: STUDIO_FILL }" @click="shut">
          <span class="menu-seam" :style="seamStyle(STUDIO_FILL)" aria-hidden="true" />
          <span class="menu-name">{{ STUDIO_LINK.label }}</span>
          <span class="menu-note">{{ STUDIO_LINK.note }}</span>
        </a>
      </nav>
    </DitherReveal>
  </dialog>
</template>
