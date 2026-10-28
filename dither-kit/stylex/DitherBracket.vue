<!-- Generated from ../tailwind/DitherBracket.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

export type BracketMatch = { a: string; b: string; winner?: "a" | "b" }

const styles = stylex.create({
  row: {
    display: "flex",
    alignItems: "stretch",
    gap: "1.5rem",
    overflowX: "auto",
    fontFamily: "var(--font-mono)",
  },
  stack: {
    display: "flex",
    minWidth: "9rem",
    flexDirection: "column",
    justifyContent: "space-around",
    gap: "0.75rem",
  },
  frame: { position: "relative" },
  box: {
    overflow: "hidden",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
  },
  component: {
    width: "100%",
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 40%, transparent)",
  },
  text: { width: "0.375rem", height: "0.375rem", flexShrink: "0", borderRadius: "1px" },
  text2: { minWidth: "0px", flex: "1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  text3: {
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
  component2: { width: "100%" },
  layer: {
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    right: "-1.5rem",
    height: "1px",
    width: "1.5rem",
    backgroundColor: "color-mix(in oklab, var(--border) 60%, transparent)",
  },
  flex: {
    display: "flex",
    height: "1.75rem",
    minWidth: "0px",
    alignItems: "center",
    gap: "0.5rem",
    paddingInline: "0.625rem",
    textAlign: "left",
    fontSize: "11px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  textForeground: { color: "var(--foreground)" },
  textMutedForeground: { color: "var(--muted-foreground)", textDecorationLine: "line-through" },
  textMutedForeground2: { color: "var(--muted-foreground)" },
  cursorPointer: {
    cursor: "pointer",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--card) 60%, transparent)",
      },
    },
    color: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" } },
  },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cssColor } from "../engine/palette"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import type { PixelColor } from "../engine/pixel"

/** Knockout bracket — columns of matches with connector rails between
 * rounds. Winners carry the accent; when interactive, clicking a side
 * reports the pick and the consumer advances the data. */
const props = withDefaults(
  defineProps<{
    /** rounds[r] is the list of matches in round r, left to right. */
    rounds: BracketMatch[][]
    color?: PixelColor
    /** Enables picking winners by click. */
    interactive?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { color: "green", interactive: false },
)
const emit = defineEmits<{ pick: [round: number, match: number, side: "a" | "b"] }>()

const accent = computed(() => cssColor(props.color))

const sideClass = (m: BracketMatch, side: "a" | "b") =>
  cn(
    styles.flex,
    m.winner === side ? styles.textForeground : m.winner ? styles.textMutedForeground : styles.textMutedForeground2,
    props.interactive && !m.winner && styles.cursorPointer,
  )
</script>

<template>
  <div :class="cn(styles.row, props.xstyle, props.class)" role="group" aria-label="Tournament bracket">
    <div v-for="(round, r) in props.rounds" :key="r" v-bind="stylex.attrs(styles.stack)">
      <div v-for="(m, i) in round" :key="i" v-bind="stylex.attrs(styles.frame)">
        <div v-bind="stylex.attrs(styles.box)">
          <component
            :is="props.interactive && !m.winner ? 'button' : 'div'"
            :type="props.interactive && !m.winner ? 'button' : undefined"
            :class="cn(sideClass(m, 'a'), styles.component, CONTROL_BUTTON)"
            @click="props.interactive && !m.winner && emit('pick', r, i, 'a')"
          >
            <span
              aria-hidden="true"
              v-bind="stylex.attrs(styles.text)"
              :style="{ background: m.winner === 'a' ? accent : 'var(--border)' }"
            />
            <span v-bind="stylex.attrs(styles.text2)">{{ m.a }}</span>
            <span v-if="m.winner === 'a'" v-bind="stylex.attrs(styles.text3)">winner</span>
          </component>
          <component
            :is="props.interactive && !m.winner ? 'button' : 'div'"
            :type="props.interactive && !m.winner ? 'button' : undefined"
            :class="cn(sideClass(m, 'b'), styles.component2, CONTROL_BUTTON)"
            @click="props.interactive && !m.winner && emit('pick', r, i, 'b')"
          >
            <span
              aria-hidden="true"
              v-bind="stylex.attrs(styles.text)"
              :style="{ background: m.winner === 'b' ? accent : 'var(--border)' }"
            />
            <span v-bind="stylex.attrs(styles.text2)">{{ m.b }}</span>
            <span v-if="m.winner === 'b'" v-bind="stylex.attrs(styles.text3)">winner</span>
          </component>
        </div>
        <span v-if="r < props.rounds.length - 1" aria-hidden="true" v-bind="stylex.attrs(styles.layer)" />
      </div>
    </div>
  </div>
</template>
