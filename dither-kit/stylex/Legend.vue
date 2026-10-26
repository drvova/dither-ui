<!-- Generated from ../tailwind/Legend.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    pointerEvents: "none",
    position: "absolute",
    insetInline: "0px",
    top: "0px",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    paddingInline: "0.25rem",
  },
  justifyEnd: { justifyContent: "flex-end" },
  justifyCenter: { justifyContent: "center" },
  justifyStart: { justifyContent: "flex-start" },
  button: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--muted-foreground)",
    transitionProperty: "opacity",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  pointerEventsAuto: {
    pointerEvents: "auto",
    cursor: "pointer",
    color: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" } },
  },
  opacity40: { opacity: "40%" },
  text: { width: "0.5rem", height: "0.5rem", borderRadius: "1px" },
})
</script>

<script setup lang="ts">
import { useCommonChart } from "../engine/common-context"
import { cn } from "./lib"
import { rgb } from "../engine/palette"

defineOptions({ chartLayer: "dom" })

const props = withDefaults(
  defineProps<{
    isClickable?: boolean
    align?: "left" | "center" | "right"
  }>(),
  { isClickable: false, align: "right" },
)

const chart = useCommonChart()

function dimmed(name: string): boolean {
  const emphasis = chart.selectedDataKey ?? chart.focusDataKey
  return emphasis !== null && emphasis !== name
}
</script>

<template>
  <div
    :class="
      cn(
        styles.row,
        props.align === 'right' && styles.justifyEnd,
        props.align === 'center' && styles.justifyCenter,
        props.align === 'left' && styles.justifyStart,
      )
    "
  >
    <button
      v-for="name in chart.names"
      :key="name"
      type="button"
      :disabled="!props.isClickable"
      :class="cn(styles.button, props.isClickable && styles.pointerEventsAuto, dimmed(name) && styles.opacity40)"
      @click="chart.selectDataKey(chart.selectedDataKey === name ? null : name)"
      @pointerenter="chart.setFocusDataKey(name)"
      @pointerleave="chart.setFocusDataKey(null)"
      @focus="chart.setFocusDataKey(name)"
      @blur="chart.setFocusDataKey(null)"
    >
      <span v-bind="stylex.attrs(styles.text)" :style="{ backgroundColor: rgb(chart.seedOf(name).fill) }" />
      {{ chart.labelOf(name) }}
    </button>
  </div>
</template>
