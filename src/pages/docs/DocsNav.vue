<script lang="ts">
import { routePath } from "@/shared/lib"

/** A section's address: the deep link every nav link carries and the URL
 * the scroll-spy writes. */
export const docsUrl = (id: string) => routePath(`/docs/${id}`)

/** Where a docs list stands: the rail beside the content (a pointer's 25px
 * targets at a 27px pitch) or the sections sheet (a finger's 30px ones). */
export type NavPlace = "rail" | "sheet"
export const NAV_LINK: Record<NavPlace, string> = { rail: "py-1 text-[11px]", sheet: "py-1.5 text-[12px]" }

/** A part of the section in view (its heading, a gallery heading, its API
 * table), read from its DOM: what "On this page" lists. */
export type PagePart = { label: string; el: HTMLElement }
</script>

<script setup lang="ts">
import { DitherIcon, type IconName } from "@dither-kit"
import { GROUPS } from "./groups"

/** The docs' section list, grouped under the families' glyphs: the sidebar
 * rail at lg, the sections sheet under it. Given the parts of the section
 * in view, the sheet lists them under its link (the first is the section's
 * own heading, which the link already is). */
const props = withDefaults(defineProps<{ activeId: string; variant: NavPlace; parts?: PagePart[] }>(), {
  parts: () => [],
})
const emit = defineEmits<{ go: [id: string]; part: [el: HTMLElement] }>()

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
  <div class="grid gap-7">
    <div v-for="grp in GROUPS" :key="grp.title">
      <div class="flex items-center gap-2 text-[11px] font-medium text-foreground">
        <DitherIcon :name="GROUP_ICON[grp.title] ?? 'Grid'" :size="13" :stroke-width="1.5" />{{ grp.title }}
        <span class="spec ml-auto tabular-nums">{{ grp.items.length }}</span>
      </div>
      <ul class="mt-2.5 grid gap-0.5 border-l border-border/60">
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
