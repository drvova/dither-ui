<script setup lang="ts">
// The site's header, one for every page that reads (the landing, the docs):
// a capsule on the raised ground floating over the page, centred, lifted by
// its shadow alone; the brand, the site's links (GitHub under its mark), a
// page's own tools (`tools`: the docs' search and sections key) and the
// chrome "Open studio" key. Under lg the links the capsule has no room for
// live in the menu (`menu.ts`): its key, the sheet's bands in miniature,
// opens them as a modal sheet of tone steps. Sticky is positioned, and z-40
// keeps it over a page's main, which isolates its art.
import { DitherIcon, DitherReveal } from "@dither-kit"
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue"
import { routePath } from "@/shared/lib"
import BrandMark from "@/shared/ui/BrandMark.vue"
import ToolMark from "@/shared/ui/ToolMark.vue"
import "./site-header.css"
import { BAND_INK, MENU_WIDE, SEAM_HEIGHT, SEAM_MASK, SHEET_WIPE, STUDIO_FILL, bandFill, maskCss } from "./menu"

/** The page the reader is on, so its own link reads as current. */
const props = defineProps<{ current: "landing" | "docs" }>()
const home = routePath("/")
const MENU_ID = "site-menu"

/** The site's links, in order: the capsule shows each from its width up,
 * the menu all of them. */
const LINKS: readonly {
  label: string
  href: string
  from: "md" | "lg"
  page?: "docs"
  external?: boolean
}[] = [
  { label: "Components", href: `${home}#examples`, from: "md" },
  { label: "Docs", href: routePath("/docs"), from: "md", page: "docs" },
  { label: "Agents", href: `${home}#ask`, from: "md" },
  { label: "GitHub", href: "https://github.com/drvova/dither-ui", from: "lg", external: true },
]
const SHOWN = { md: "hidden md:inline-flex", lg: "hidden lg:inline-flex" } as const
const isCurrent = (l: (typeof LINKS)[number]) => l.page !== undefined && l.page === props.current
const seam = `${maskCss(SEAM_MASK)};height:${SEAM_HEIGHT}px;top:-${SEAM_HEIGHT}px`

// The menu: a native modal dialog (focus held inside, Escape closes, the page
// inert under it), the page holding still while it is open.
const open = ref(false)
const sheet = ref<HTMLDialogElement | null>(null)
const key = ref<HTMLButtonElement | null>(null)
const lock = (on: boolean) => {
  document.documentElement.style.overflow = on ? "hidden" : ""
}
async function show() {
  open.value = true
  lock(true)
  await nextTick()
  sheet.value?.showModal?.()
}
function hide() {
  if (!open.value) return
  open.value = false
  lock(false)
  if (sheet.value?.open) sheet.value.close()
  key.value?.focus()
}

// From lg the capsule holds every link: a menu left open by a rotation closes.
let wide: MediaQueryList | null = null
const onWide = (e: MediaQueryListEvent) => e.matches && hide()
onMounted(() => {
  wide = typeof matchMedia === "function" ? matchMedia(`(min-width: ${MENU_WIDE}px)`) : null
  wide?.addEventListener("change", onWide)
})
onBeforeUnmount(() => {
  wide?.removeEventListener("change", onWide)
  if (open.value) lock(false)
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
          v-for="l in LINKS"
          :key="l.label"
          :href="l.href"
          class="nav-a"
          :class="[SHOWN[l.from], { 'text-foreground': isCurrent(l) }]"
          :aria-current="isCurrent(l) ? 'page' : undefined"
          :target="l.external ? '_blank' : undefined"
          :rel="l.external ? 'noreferrer' : undefined"
          ><ToolMark v-if="l.external" id="github" :size="13" />{{ l.label
          }}<span v-if="l.external" class="sr-only"> (opens in a new tab)</span></a
        >
      </nav>
      <div class="flex items-center gap-1">
        <slot name="tools" />
        <a :href="routePath('/studio')" class="nav-a key-chrome studio-key hidden md:inline-flex">Open studio</a>
        <button
          ref="key"
          type="button"
          class="nav-a menu-key lg:hidden"
          aria-haspopup="dialog"
          :aria-expanded="open"
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

  <dialog :id="MENU_ID" ref="sheet" class="site-menu" aria-label="Site menu" @close="hide">
    <DitherReveal v-if="open" v-bind="SHEET_WIPE" easing="linear" class="menu-sheet">
      <div class="menu-top">
        <span class="flex items-center gap-2.5 text-xs"><BrandMark :size="13" />dither-ui</span>
        <button type="button" class="menu-close" aria-label="Close menu" autofocus @click="hide">
          <DitherIcon name="Close" :size="16" :stroke-width="1.5" />
        </button>
      </div>
      <nav class="menu-bands" aria-label="Site">
        <a
          v-for="(l, i) in LINKS"
          :key="l.label"
          :href="l.href"
          class="menu-band"
          :style="{ background: bandFill(i) }"
          :aria-current="isCurrent(l) ? 'page' : undefined"
          :target="l.external ? '_blank' : undefined"
          :rel="l.external ? 'noreferrer' : undefined"
          @click="hide"
        >
          <span class="menu-seam" :style="`${seam};background:${bandFill(i)}`" aria-hidden="true" />
          <ToolMark v-if="l.external" id="github" :size="18" />{{ l.label
          }}<span v-if="l.external" class="sr-only"> (opens in a new tab)</span>
        </a>
        <a :href="routePath('/studio')" class="menu-band" :style="{ background: STUDIO_FILL }" @click="hide">
          <span class="menu-seam" :style="`${seam};background:${STUDIO_FILL}`" aria-hidden="true" />
          Open studio
        </a>
      </nav>
    </DitherReveal>
  </dialog>
</template>
