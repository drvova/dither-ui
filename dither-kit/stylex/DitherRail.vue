<!-- Generated from ../tailwind/DitherRail.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  aside: {
    display: "flex",
    height: "100%",
    width: "3.5rem",
    flexShrink: "0",
    flexDirection: "column",
    padding: "0.5rem",
  },
  aside2: {
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 40%, transparent)",
  },
  nav: {
    marginTop: "0.5rem",
    display: "grid",
    minHeight: "0px",
    flex: "1",
    alignContent: "flex-start",
    gap: "0.125rem",
    overflowY: "auto",
  },
  borderL: { borderLeftStyle: "solid", borderLeftWidth: "1px" },
  borderR: { borderRightStyle: "solid", borderRightWidth: "1px" },
})
</script>

<script setup lang="ts">
import { computed, provide, ref } from "vue"
import { SIDEBAR_COLLAPSED, SIDEBAR_COMPACT } from "./DitherSidebar.vue"
import { cn, type StyleProp } from "./lib"

/** Permanent icon rail — the whole nav in 56px. Provides the sidebar's
 * collapsed context, so DitherSidebarItem children fold their labels
 * automatically; wrap items in DitherTooltip to carry the labels. */
const props = withDefaults(
  defineProps<{
    label?: string
    /** Which edge it sits on — flips the border. */
    side?: "left" | "right"
    class?: string
    xstyle?: StyleProp
  }>(),
  { label: "Rail", side: "left" },
)

provide(SIDEBAR_COLLAPSED, ref(true))
provide(SIDEBAR_COMPACT, ref(false))

const edge = computed(() => (props.side === "right" ? styles.borderL : styles.borderR))
</script>

<template>
  <aside :aria-label="props.label" :class="cn(styles.aside, edge, styles.aside2, props.xstyle, props.class)">
    <slot name="header" />
    <nav v-bind="stylex.attrs(styles.nav)">
      <slot />
    </nav>
    <slot name="footer" />
  </aside>
</template>
