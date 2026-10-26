<!-- Generated from ../tailwind/DitherSchedule.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

export type ScheduleEvent = { start: number; end: number; label: string; color?: PixelColor }

const styles = stylex.create({
  row: { display: "flex", gap: "0.5rem", fontFamily: "var(--font-mono)" },
  frame: { position: "relative", width: "2.5rem", flexShrink: "0", textAlign: "right" },
  layer: {
    position: "absolute",
    right: "0px",
    translate: "0 calc(calc(1 / 2 * 100%) * -1)",
    fontSize: "9px",
    color: "color-mix(in oklab, var(--muted-foreground) 60%, transparent)",
    fontVariantNumeric: "   tabular-nums ",
  },
  frame2: {
    position: "relative",
    minHeight: "12rem",
    flex: "1",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 40%, transparent)",
  },
  layer2: {
    position: "absolute",
    insetInline: "0px",
    height: "1px",
    backgroundColor: "color-mix(in oklab, var(--border) 30%, transparent)",
  },
  layer3: {
    position: "absolute",
    insetInline: "0.375rem",
    overflow: "hidden",
    borderRadius: "4px",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 80%, transparent)",
    paddingInline: "0.5rem",
    paddingBlock: "0.25rem",
  },
  layer4: { position: "absolute", insetBlock: "0px", left: "0px", width: "2px" },
  p: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    paddingLeft: "0.375rem",
    fontSize: "10px",
    color: "var(--foreground)",
  },
  p2: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    paddingLeft: "0.375rem",
    fontSize: "9px",
    color: "color-mix(in oklab, var(--muted-foreground) 70%, transparent)",
    fontVariantNumeric: "   tabular-nums ",
  },
  layer5: { position: "absolute", insetInline: "0px", zIndex: "10" },
  layer6: {
    position: "absolute",
    top: "-3px",
    left: "0px",
    width: "7px",
    height: "7px",
    borderRadius: "calc(infinity * 1px)",
  },
  text: { display: "block", height: "1px", width: "100%" },
  text2: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cssColor } from "../engine/palette"
import { cn, type StyleProp } from "./lib"
import type { PixelColor } from "../engine/pixel"

/** Day timeline — an hour rail with events placed proportionally, and an
 * optional now line. Hours are fractional (9.5 is half past nine). */
const props = withDefaults(
  defineProps<{
    events: ScheduleEvent[]
    /** Day window, fractional hours. */
    from?: number
    to?: number
    /** Draw the now line at this hour; omit to hide. */
    now?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { from: 8, to: 18 },
)

const span = computed(() => Math.max(1, props.to - props.from))
const pct = (h: number) => `${((Math.min(Math.max(h, props.from), props.to) - props.from) / span.value) * 100}%`
const hours = computed(() =>
  Array.from({ length: Math.floor(props.to) - Math.ceil(props.from) + 1 }, (_, i) => Math.ceil(props.from) + i),
)
const fmt = (h: number) =>
  `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`
</script>

<template>
  <div :class="cn(styles.row, props.xstyle, props.class)" role="group" aria-label="Day schedule">
    <div v-bind="stylex.attrs(styles.frame)" aria-hidden="true">
      <span v-for="h in hours" :key="h" v-bind="stylex.attrs(styles.layer)" :style="{ top: pct(h) }">{{
        String(h).padStart(2, "0")
      }}</span>
    </div>
    <div v-bind="stylex.attrs(styles.frame2)">
      <span
        v-for="h in hours"
        :key="h"
        aria-hidden="true"
        v-bind="stylex.attrs(styles.layer2)"
        :style="{ top: pct(h) }"
      />
      <div
        v-for="(e, i) in props.events"
        :key="i"
        v-bind="stylex.attrs(styles.layer3)"
        :style="{
          top: pct(e.start),
          height: `calc(${((Math.min(e.end, props.to) - Math.max(e.start, props.from)) / span) * 100}% - 2px)`,
        }"
      >
        <span
          aria-hidden="true"
          v-bind="stylex.attrs(styles.layer4)"
          :style="{ background: cssColor(e.color ?? 'blue') }"
        />
        <p v-bind="stylex.attrs(styles.p)">{{ e.label }}</p>
        <p v-bind="stylex.attrs(styles.p2)">{{ fmt(e.start) }}–{{ fmt(e.end) }}</p>
      </div>
      <div
        v-if="props.now !== undefined && props.now >= props.from && props.now <= props.to"
        v-bind="stylex.attrs(styles.layer5)"
        :style="{ top: pct(props.now) }"
        role="presentation"
      >
        <span v-bind="stylex.attrs(styles.layer6)" :style="{ background: cssColor('red') }" aria-hidden="true" />
        <span v-bind="stylex.attrs(styles.text)" :style="{ background: cssColor('red') }" aria-hidden="true" />
        <span v-bind="stylex.attrs(styles.text2)">Current time {{ fmt(props.now) }}</span>
      </div>
    </div>
  </div>
</template>
