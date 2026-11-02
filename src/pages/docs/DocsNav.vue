<script lang="ts">
import { routePath } from "@/shared/lib"

/** A section's address: the deep link every nav link carries and the URL
 * a section's page lives at. */
export const docsUrl = (id: string) => routePath(`/docs/${id}`)

/** Where a docs list stands: the rail beside the content (a pointer's 25px
 * targets at a 27px pitch) or the sections sheet (a finger's 30px ones). */
export type NavPlace = "rail" | "sheet"
export const NAV_LINK: Record<NavPlace, string> = { rail: "py-1 text-[11px]", sheet: "py-1.5 text-[12px]" }
/** A group's heading sticks to the top of its list while its sections
 * scroll under it (the landmark in a long list). The list's top room lives
 * here, not on the scroller, since a sticky heading sticks at the
 * scroller's content edge and its padding would show the list above it.
 * In the rail the heading lies on the page's ground, unseen; in the sheet
 * each group is a band of the menu's (a step of the ink toward the ground,
 * seamed into the one above through the Bayer matrix) and its heading
 * sticks on the band's own fill. */
export const NAV_PLACE: Record<NavPlace, { top: string; head: string }> = {
  rail: { top: "pt-10", head: "bg-background" },
  sheet: { top: "", head: "" },
}

/** A part of the section in view (its heading, a gallery heading, its API
 * table), read from its DOM: what "On this page" lists. */
export type PagePart = { label: string; el: HTMLElement }
</script>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue"
import { DitherIcon, type IconName } from "@dither-kit"
import { pixelPrefersReducedMotion } from "@dither-kit/engine/pixel"
import { bandFill, seamStyle } from "@/widgets/site-header/menu"
import { GROUPS } from "./groups"

/** The docs' section list, grouped under the families' glyphs: the sidebar
 * rail at lg, the sections sheet under it. Given the parts of the section
 * in view, the sheet lists them under its link (the first is the section's
 * own heading, which the link already is). */
const props = withDefaults(defineProps<{ activeId: string; variant: NavPlace; parts?: PagePart[] }>(), {
  parts: () => [],
})
const emit = defineEmits<{ go: [id: string]; part: [el: HTMLElement] }>()

// The rail keeps the section in view in its own view: when the current link
// leaves the rail's middle band it scrolls the rail (never the page) to put
// it in the middle, at once on the first (a deep link), smoothly after.
const root = ref<HTMLElement | null>(null)
let placed = false
/** The nearest ancestor that scrolls on its own: the rail's aside. */
const scroller = (el: HTMLElement | null) => {
  for (let n = el?.parentElement; n; n = n.parentElement) {
    const y = getComputedStyle(n).overflowY
    if (y === "auto" || y === "scroll") return n
  }
  return null
}
watch(
  () => props.activeId,
  async () => {
    if (props.variant !== "rail") return
    await nextTick()
    const rail = scroller(root.value)
    const link = root.value?.querySelector<HTMLElement>("a[aria-current]")
    if (!rail || !link) return
    const box = rail.getBoundingClientRect()
    const at = link.getBoundingClientRect()
    const margin = box.height * 0.2
    if (at.top >= box.top + margin && at.bottom <= box.bottom - margin) return
    const smooth = placed && !pixelPrefersReducedMotion()
    rail.scrollTo({ top: rail.scrollTop + at.top - box.top - box.height / 2, behavior: smooth ? "smooth" : "auto" })
    placed = true
  },
  { flush: "post" },
)

// Groups fold: the one holding the current section opens itself, the
// reader opens or closes the rest; a folded group's links stay in the DOM
// (hidden), so the list is whole for find-in-page and the crawler.
const opened = ref(new Set<string>())
const groupOf = (id: string) => GROUPS.find((g) => g.items.some((i) => i.id === id))?.title
watch(
  () => props.activeId,
  (id) => {
    const g = groupOf(id)
    if (g && !opened.value.has(g)) opened.value = new Set([...opened.value, g])
  },
  { immediate: true },
)
function fold(title: string) {
  const next = new Set(opened.value)
  if (next.has(title)) next.delete(title)
  else next.add(title)
  opened.value = next
}
/** A group's band in the sheet: its fill, one step per group down the list. */
const band = (i: number) => (props.variant === "sheet" ? bandFill(i, GROUPS.length) : undefined)
const listId = (title: string) => `docs-${props.variant}-${title.toLowerCase().replace(/\W+/g, "-")}`

// Each group under its glyph (the landing's family glyphs).
const GROUP_ICON: Record<string, IconName> = {
  Overview: "Home",
  Primitives: "Box",
  Typography: "Type",
  Handbook: "Book",
  Examples: "Layout",
  Components: "Grid",
  Backgrounds: "Image",
  Text: "Sparkles",
  Animations: "Pulse",
  Utils: "Palette",
}
</script>

<template>
  <div ref="root" class="docs-nav grid gap-3" :class="NAV_PLACE[props.variant].top" :data-place="props.variant">
    <div v-for="(grp, gi) in GROUPS" :key="grp.title" class="nav-grp" :style="band(gi) && { background: band(gi) }">
      <span v-if="band(gi)" class="menu-seam" :style="seamStyle(band(gi)!)" aria-hidden="true" />
      <button
        type="button"
        class="nav-head sticky top-0 z-10 flex min-h-7 w-full items-center gap-2 py-1.5 text-left text-[11px] font-medium text-foreground"
        :class="NAV_PLACE[props.variant].head"
        :style="band(gi) && { background: band(gi) }"
        :aria-expanded="opened.has(grp.title)"
        :aria-controls="listId(grp.title)"
        @click="fold(grp.title)"
      >
        <DitherIcon :name="GROUP_ICON[grp.title] ?? 'Grid'" :size="13" :stroke-width="1.5" />{{ grp.title }}
        <span class="spec ml-auto tabular-nums">{{ grp.items.length }}</span>
        <DitherIcon
          name="ChevronRight"
          :size="12"
          :stroke-width="1.75"
          class="text-muted-foreground transition-transform duration-150 motion-reduce:transition-none"
          :class="opened.has(grp.title) ? 'rotate-90' : ''"
        />
      </button>
      <ul v-show="opened.has(grp.title)" :id="listId(grp.title)" class="mt-1 grid gap-0.5 border-l border-border/60">
        <li v-for="it in grp.items" :key="it.id">
          <a
            :href="docsUrl(it.id)"
            :aria-current="props.activeId === it.id ? 'true' : undefined"
            class="-ml-px block border-l pl-3 transition-colors"
            :class="[
              NAV_LINK[props.variant],
              props.activeId === it.id
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground',
            ]"
            @click.prevent="emit('go', it.id)"
            >{{ it.label }}</a
          >
          <ul v-if="props.activeId === it.id && props.parts.length > 1" aria-label="On this page" class="grid gap-0.5">
            <li v-for="(p, i) in props.parts.slice(1)" :key="i">
              <button
                type="button"
                class="block w-full pl-6 text-left text-muted-foreground transition-colors hover:text-foreground"
                :class="NAV_LINK[props.variant]"
                @click="emit('part', p.el)"
              >
                {{ p.label }}
              </button>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* The sheet: the families as the menu's bands, filling the screen when
   folded and growing with the one open; the ground's colour writes on
   every band (AA down to the floor), the section in view printed in
   reverse, the ground's own ink on it. */
.docs-nav[data-place="sheet"] {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 100%;
  color: var(--background);
}

.docs-nav[data-place="sheet"] > .nav-grp {
  position: relative;
  flex: 1 0 auto;
  min-height: 56px;
  padding: 0 16px 12px;
}

.docs-nav[data-place="sheet"] .nav-head {
  min-height: 48px;
  padding-inline: 4px;
  font-size: 14px;
  color: var(--background);
}

.docs-nav[data-place="sheet"] .nav-head :is(.spec, svg) {
  color: var(--background);
}

.docs-nav[data-place="sheet"] ul {
  border: 0;
}

.docs-nav[data-place="sheet"] :is(a, ul button) {
  margin: 0;
  padding-inline: 10px;
  border: 0;
  border-radius: 6px;
  color: var(--background);
}

.docs-nav[data-place="sheet"] ul ul button {
  padding-left: 24px;
}

.docs-nav[data-place="sheet"] a:hover {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
}

.docs-nav[data-place="sheet"] a[aria-current] {
  color: var(--foreground);
  background: var(--background);
}

/* On a band of the ink the ring ink alone would vanish: the ground runs
   inside it, so one of the two always shows. */
.docs-nav[data-place="sheet"] :is(a, button):focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: -2px;
  box-shadow: inset 0 0 0 4px var(--background);
}

@media (forced-colors: active) {
  .menu-seam {
    display: none;
  }
}
</style>
