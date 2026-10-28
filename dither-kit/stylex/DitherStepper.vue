<!-- Generated from ../tailwind/DitherStepper.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

export type Step = { label: string; hint?: string }

const styles = stylex.create({
  ol: { display: "flex", alignItems: "flex-start" },
  li: { display: "flex", flex: "1", flexDirection: "column", alignItems: "center" },
  row: { display: "flex", width: "100%", alignItems: "center" },
  separator: { flex: "1" },
  separator2: { opacity: "30%" },
  row2: {
    display: "inline-flex",
    width: "1.75rem",
    height: "1.75rem",
    flexShrink: "0",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    fontSize: "11px",
    fontVariantNumeric: "   tabular-nums ",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  borderForeground30: {
    borderColor: "color-mix(in oklab, var(--foreground) 30%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--foreground) 10%, transparent)",
    color: "var(--foreground)",
  },
  borderForeground: {
    borderColor: "var(--foreground)",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
  },
  borderBorder: { borderColor: "var(--border)", color: "var(--muted-foreground)" },
  svg: { width: "0.875rem", height: "0.875rem" },
  text: { marginTop: "0.5rem", textAlign: "center", fontSize: "12px" },
  textForeground: { color: "var(--foreground)" },
  textMutedForeground: { color: "var(--muted-foreground)" },
  text2: { textAlign: "center", fontSize: "11px", color: "var(--muted-foreground)" },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"
import DitherSeparator from "./DitherSeparator.vue"

const props = withDefaults(
  defineProps<{
    steps: Step[]
    current: number // index of the active step
    class?: string
    xstyle?: StyleProp
  }>(),
  {},
)

const state = (i: number) => (i < props.current ? "done" : i === props.current ? "active" : "todo")
</script>

<template>
  <ol :class="cn(styles.ol, props.xstyle, props.class)" role="list" aria-label="Progress">
    <li
      v-for="(s, i) in steps"
      :key="i"
      v-bind="stylex.attrs(styles.li)"
      :aria-current="i === current ? 'step' : undefined"
    >
      <div v-bind="stylex.attrs(styles.row)">
        <DitherSeparator v-if="i > 0" :xstyle="[styles.separator, state(i) === 'todo' ? styles.separator2 : null]" />
        <span v-else v-bind="stylex.attrs(styles.separator)" />
        <span
          :class="
            cn(
              styles.row2,
              state(i) === 'done' && styles.borderForeground30,
              state(i) === 'active' && styles.borderForeground,
              state(i) === 'todo' && styles.borderBorder,
            )
          "
        >
          <svg
            v-if="state(i) === 'done'"
            viewBox="0 0 24 24"
            v-bind="stylex.attrs(styles.svg)"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
          >
            <path d="M5 12l5 5L20 7" />
          </svg>
          <template v-else>{{ i + 1 }}</template>
        </span>
        <DitherSeparator
          v-if="i < steps.length - 1"
          :xstyle="[
            styles.separator,
            state(i + 1) === 'todo' && state(i) !== 'active'
              ? styles.separator2
              : state(i) === 'todo'
                ? styles.separator2
                : null,
          ]"
        />
        <span v-else v-bind="stylex.attrs(styles.separator)" />
      </div>
      <span :class="cn(styles.text, i === current ? styles.textForeground : styles.textMutedForeground)">{{
        s.label
      }}</span>
      <span v-if="s.hint" v-bind="stylex.attrs(styles.text2)">{{ s.hint }}</span>
    </li>
  </ol>
</template>
