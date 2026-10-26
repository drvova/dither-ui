<!-- Generated from ../tailwind/DitherConsole.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

export type ConsoleLevel = "info" | "success" | "warn" | "error"
export type ConsoleLine = { text: string; level?: ConsoleLevel; at?: string }

const styles = stylex.create({
  stack: {
    display: "flex",
    minHeight: "0px",
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
  },
  row: {
    display: "flex",
    height: "2rem",
    flexShrink: "0",
    alignItems: "center",
    gap: "0.5rem",
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingInline: "0.75rem",
  },
  text: {
    width: "0.375rem",
    height: "0.375rem",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "color-mix(in oklab, var(--muted-foreground) 50%, transparent)",
  },
  text2: {
    fontSize: "10px",
    letterSpacing: "0.2em",
    color: "color-mix(in oklab, var(--muted-foreground) 70%, transparent)",
    textTransform: "uppercase",
  },
  row2: { marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.375rem" },
  box: {
    minHeight: "0px",
    flex: "1",
    overflowY: "auto",
    padding: "0.75rem",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    lineHeight: "1.625",
  },
  p: { color: "color-mix(in oklab, var(--muted-foreground) 50%, transparent)" },
  p2: { display: "flex", gap: "0.5rem", whiteSpace: "pre-wrap" },
  text3: {
    flexShrink: "0",
    color: "color-mix(in oklab, var(--muted-foreground) 40%, transparent)",
    fontVariantNumeric: "   tabular-nums ",
  },
  text4: {
    marginTop: "0.125rem",
    display: "inline-block",
    height: "0.75rem",
    width: "0.375rem",
    animation: {
      default: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    backgroundColor: "color-mix(in oklab, var(--muted-foreground) 70%, transparent)",
  },
})
</script>

<script setup lang="ts">
import { computed, nextTick, ref, useSlots, watch } from "vue"
import { cn, type StyleProp } from "./lib"

/** Monospace log surface — level-tinted lines, an optional blinking caret,
 * and follow mode that keeps the newest line in view. */
const props = withDefaults(
  defineProps<{
    lines?: (string | ConsoleLine)[]
    title?: string
    /** Pin the view to the newest line as output arrives. */
    follow?: boolean
    /** Blinking block caret after the last line (still under reduced motion). */
    caret?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { lines: () => [], title: "console", follow: true, caret: true },
)

const slots = useSlots()
const body = ref<HTMLDivElement | null>(null)

const rows = computed<ConsoleLine[]>(() => props.lines.map((l) => (typeof l === "string" ? { text: l } : l)))

const LEVEL_VAR: Record<ConsoleLevel, string> = {
  info: "var(--muted-foreground)",
  success: "var(--swatch-green, currentColor)",
  warn: "var(--swatch-orange, currentColor)",
  error: "var(--swatch-red, currentColor)",
}

watch(
  () => rows.value.length,
  () => {
    if (props.follow) nextTick(() => body.value?.scrollTo({ top: body.value.scrollHeight }))
  },
  { flush: "post" },
)
</script>

<template>
  <div :class="cn(styles.stack, props.xstyle, props.class)">
    <div v-bind="stylex.attrs(styles.row)">
      <span v-bind="stylex.attrs(styles.text)" aria-hidden="true" />
      <span v-bind="stylex.attrs(styles.text2)">{{ props.title }}</span>
      <span v-if="slots.actions" v-bind="stylex.attrs(styles.row2)">
        <slot name="actions" />
      </span>
    </div>
    <div ref="body" role="log" aria-live="polite" v-bind="stylex.attrs(styles.box)">
      <p v-if="!rows.length" v-bind="stylex.attrs(styles.p)">No output yet.</p>
      <p v-for="(l, i) in rows" :key="i" v-bind="stylex.attrs(styles.p2)">
        <span v-if="l.at" v-bind="stylex.attrs(styles.text3)">{{ l.at }}</span>
        <span :style="{ color: LEVEL_VAR[l.level ?? 'info'] }">{{ l.text }}</span>
      </p>
      <span v-if="props.caret" aria-hidden="true" v-bind="stylex.attrs(styles.text4)" />
    </div>
  </div>
</template>
