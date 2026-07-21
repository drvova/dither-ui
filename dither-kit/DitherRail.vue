<script setup lang="ts">
import { computed, provide, ref } from "vue"
import { SIDEBAR_COLLAPSED, SIDEBAR_COMPACT } from "./DitherSidebar.vue"
import { cn } from "./lib"

/** Permanent icon rail — the whole nav in 56px. Provides the sidebar's
 * collapsed context, so DitherSidebarItem children fold their labels
 * automatically; wrap items in DitherTooltip to carry the labels. */
const props = withDefaults(
  defineProps<{
    label?: string
    /** Which edge it sits on — flips the border. */
    side?: "left" | "right"
    class?: string
  }>(),
  { label: "Rail", side: "left" }
)

provide(SIDEBAR_COLLAPSED, ref(true))
provide(SIDEBAR_COMPACT, ref(false))

const edge = computed(() => (props.side === "right" ? "border-l" : "border-r"))
</script>

<template>
  <aside
    :aria-label="props.label"
    :class="cn('flex h-full w-14 shrink-0 flex-col p-2', edge, 'border-border/60 bg-background/40', props.class)"
  >
    <slot name="header" />
    <nav class="mt-2 grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto">
      <slot />
    </nav>
    <slot name="footer" />
  </aside>
</template>
