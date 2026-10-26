<!-- Generated from ../tailwind/Tooltip.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: {
    pointerEvents: "none",
    position: "absolute",
    zIndex: "10",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    paddingInline: "0.5rem",
    paddingBlock: "0.25rem",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  },
  box: {
    marginBottom: "0.125rem",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--muted-foreground)",
  },
  stack: { display: "flex", flexDirection: "column", gap: "0.125rem" },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--popover-foreground)",
    fontVariantNumeric: "   tabular-nums ",
  },
  text: { width: "0.5rem", height: "0.5rem", borderRadius: "1px" },
  text2: { color: "var(--muted-foreground)" },
  text3: { marginLeft: "auto", paddingLeft: "0.5rem", color: "var(--foreground)" },
  variantDefault: { backgroundColor: "var(--popover)" },
  variantFrostedGlass: {
    backgroundColor: "color-mix(in oklab, var(--popover) 70%, transparent)",
    WebkitBackdropFilter: "blur(8px)        ",
    backdropFilter: "blur(8px)        ",
  },
})
</script>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useCommonChart } from "../engine/common-context"
import { cn, type StyleProp } from "./lib"
import { rgb } from "../engine/palette"

export type TooltipVariant = "default" | "frosted-glass"

defineOptions({ chartLayer: "dom" })

const props = withDefaults(
  defineProps<{
    labelKey?: string
    valueFormatter?: (value: number, name: string) => string
    variant?: TooltipVariant
  }>(),
  { variant: "default" },
)

const VARIANT: Record<TooltipVariant, StyleProp> = {
  default: styles.variantDefault,
  "frosted-glass": styles.variantFrostedGlass,
}

const chart = useCommonChart()
const show = computed(() => chart.ready && chart.hoverIndex != null)

// Retain the last hovered index so the card keeps its content while fading out.
const lastIndex = ref(0)
watch(
  () => chart.hoverIndex,
  (hi) => {
    if (hi != null) lastIndex.value = hi
  },
)
const index = computed(() => chart.hoverIndex ?? lastIndex.value)
const heading = computed(() => chart.heading(index.value, props.labelKey))
const items = computed(() => chart.itemsAt(index.value))
</script>

<template>
  <Transition name="dk-tooltip">
    <div
      v-if="show && items.length > 0"
      :class="cn([styles.layer, 'dk-tooltip-card'], VARIANT[props.variant])"
      :style="{
        top: `${chart.tooltipTop}px`,
        left: `${chart.tooltipLeft}px`,
        transform: 'translate(-50%, -115%)',
      }"
    >
      <div v-if="heading" v-bind="stylex.attrs(styles.box)">
        {{ heading }}
      </div>
      <div v-bind="stylex.attrs(styles.stack)">
        <div
          v-for="item in items"
          :key="item.name"
          v-bind="stylex.attrs(styles.row)"
          :style="{ opacity: item.dimmed ? 0.4 : 1 }"
        >
          <span v-bind="stylex.attrs(styles.text)" :style="{ backgroundColor: rgb(item.seed.fill) }" />
          <span v-bind="stylex.attrs(styles.text2)">{{ item.label }}</span>
          <span v-bind="stylex.attrs(styles.text3)">
            {{ props.valueFormatter ? props.valueFormatter(item.value, item.name) : item.value.toLocaleString() }}
          </span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Glide between points (top/left) with a spring-ish curve; fade via Transition.
   Replaces the React `motion` spring with native CSS — no dependency. */
.dk-tooltip-card {
  transition:
    top 260ms cubic-bezier(0.22, 1, 0.36, 1),
    left 260ms cubic-bezier(0.22, 1, 0.36, 1);
}
.dk-tooltip-enter-active,
.dk-tooltip-leave-active {
  transition: opacity 180ms ease;
}
.dk-tooltip-enter-from,
.dk-tooltip-leave-to {
  opacity: 0;
}
</style>
