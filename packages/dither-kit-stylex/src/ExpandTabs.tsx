// Generated from @dither-ui/kit/solid/ExpandTabs.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { For, mergeProps } from "solid-js"
import { cssColor } from "@dither-ui/kit/engine/palette.ts"
import type { PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { width: "0.375rem", height: "0.375rem", flexShrink: "0", borderRadius: "1px" },
  grid: {
    display: "grid",
    transitionProperty: { default: "grid-template-columns", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  pl2: { paddingLeft: "0.5rem" },
  text2: { minWidth: "0px", overflow: "hidden", whiteSpace: "nowrap" },
  row: {
    display: "inline-flex",
    gap: "0.25rem",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 40%, transparent)",
    padding: "0.25rem",
  },
  button: {
    display: "flex",
    height: "2rem",
    alignItems: "center",
    gap: "0px",
    borderRadius: "var(--radius)",
    paddingInline: "0.625rem",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  bgCard: { backgroundColor: "var(--card)", color: "var(--foreground)" },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--card) 60%, transparent)",
      },
    },
  },
})

export type ExpandTab = { value: string; label: string; color?: PixelColor }

/** Icon bar where only the active tab unfolds its label — the rest stay
 * square glyphs. The label slides through a 0fr -> 1fr column, the house
 * grid trick, stilled under reduced motion. */
export type ExpandTabsProps = {
  tabs: ExpandTab[]
  modelValue: string
  color?: PixelColor
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string) => void
}

export default function ExpandTabs(raw: ExpandTabsProps) {
  const props = mergeProps({ color: "blue" as PixelColor }, raw)

  const hue = (t: ExpandTab) => cssColor(t.color ?? props.color)

  return (
    <div class={cn(styles.row, props.xstyle, props.class)} role="tablist">
      <For each={props.tabs}>
        {(t) => (
          <button
            type="button"
            role="tab"
            aria-selected={props.modelValue === t.value}
            class={cn(styles.button, props.modelValue === t.value ? styles.bgCard : styles.textMutedForeground)}
            onClick={() => props.onUpdateModelValue?.(t.value)}
          >
            <span
              aria-hidden="true"
              {...stylex.props(styles.text)}
              style={{
                background: props.modelValue === t.value ? hue(t) : "currentColor",
                opacity: props.modelValue === t.value ? 1 : 0.7,
              }}
            />
            <span
              {...stylex.props(styles.grid)}
              style={{ "grid-template-columns": props.modelValue === t.value ? "1fr" : "0fr" }}
            >
              <span class={cn(styles.text2, props.modelValue === t.value && styles.pl2)}>{t.label}</span>
            </span>
          </button>
        )}
      </For>
    </div>
  )
}
