<!-- Generated from ../tailwind/DitherSidebarGroup.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: { marginTop: { default: "1rem", ":first-child": "0px" } },
  box2: {
    paddingInline: "0.625rem",
    paddingBottom: "0.375rem",
    fontSize: "10px",
    letterSpacing: "0.2em",
    color: "color-mix(in oklab, var(--muted-foreground) 70%, transparent)",
    textTransform: "uppercase",
  },
  box3: {
    marginInline: "0.625rem",
    marginBottom: "0.375rem",
    height: "1px",
    backgroundColor: "color-mix(in oklab, var(--border) 60%, transparent)",
  },
  grid: { display: "grid", gap: "0.125rem" },
})
</script>

<script setup lang="ts">
import { inject, ref } from "vue"
import { SIDEBAR_COLLAPSED } from "./DitherSidebar.vue"

/** Labelled cluster of sidebar items. On the icon rail the label folds into
 * a hairline separator so the grouping survives the collapse. */
const props = defineProps<{ label?: string }>()

const collapsed = inject(SIDEBAR_COLLAPSED, ref(false))
</script>

<template>
  <div v-bind="stylex.attrs(styles.box)" role="group" :aria-label="props.label">
    <div v-if="props.label && !collapsed" v-bind="stylex.attrs(styles.box2)">
      {{ props.label }}
    </div>
    <div v-else-if="props.label && collapsed" aria-hidden="true" v-bind="stylex.attrs(styles.box3)" />
    <div v-bind="stylex.attrs(styles.grid)">
      <slot />
    </div>
  </div>
</template>
