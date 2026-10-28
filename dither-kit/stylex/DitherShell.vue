<!-- Generated from ../tailwind/DitherShell.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: {
    display: "grid",
    height: "100%",
    minHeight: "0px",
    gridTemplateRows: "auto minmax(0,1fr) auto",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
  },
  overflowHidden: {
    overflow: "hidden",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
  },
  grid2: { display: "grid", minHeight: "0px", gridTemplateColumns: "auto minmax(0,1fr)" },
  main: { minHeight: "0px", minWidth: "0px" },
  colSpan2: { gridColumn: "span 2 / span 2" },
  footer: {
    display: "flex",
    alignItems: "center",
    borderTopStyle: "solid",
    borderTopWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
  },
})
</script>

<script setup lang="ts">
import { useSlots } from "vue"
import { cn, type StyleProp } from "./lib"

/** App frame: topbar over an aside + content pair, optional statusbar under.
 * Regions render only when their slot is filled — the grid adapts. */
const props = withDefaults(
  defineProps<{
    /** true draws the embedded card chrome — border, rounding, clip. */
    frame?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { frame: false },
)
const slots = useSlots()
</script>

<template>
  <div :class="cn(styles.grid, props.frame && styles.overflowHidden, props.xstyle, props.class)">
    <header v-if="slots.topbar" v-bind="stylex.attrs(styles.header)">
      <slot name="topbar" />
    </header>
    <div v-else aria-hidden="true" />
    <div v-bind="stylex.attrs(styles.grid2)">
      <slot name="aside" />
      <main :class="cn(styles.main, !slots.aside && styles.colSpan2)">
        <slot />
      </main>
    </div>
    <footer v-if="slots.statusbar" v-bind="stylex.attrs(styles.footer)">
      <slot name="statusbar" />
    </footer>
    <div v-else aria-hidden="true" />
  </div>
</template>
