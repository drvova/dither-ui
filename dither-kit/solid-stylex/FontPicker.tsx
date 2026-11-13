// Generated from ../solid/FontPicker.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { For, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  input: {
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
  text: { fontSize: "13px" },
  text2: { fontSize: "11px", color: "var(--muted-foreground)" },
  grid: {
    display: "grid",
    gap: "0.25rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    padding: "0.375rem",
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
  flex: {
    display: "flex",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    borderRadius: "0.25rem",
    paddingInline: "0.625rem",
    paddingBlock: "0.5rem",
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  bgAccent15: {
    backgroundColor: "color-mix(in oklab, var(--accent) 15%, transparent)",
    color: "var(--foreground)",
  },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--accent) 10%, transparent)",
      },
    },
  },
})

/** Font stack picker: each option renders its own name in its own family so
 * the preview IS the choice — no separate swatch to drift. Value = the CSS
 * font stack string. */
const FONT_STACKS: Array<{ label: string; stack: string }> = [
  { label: "System UI", stack: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { label: "Geometric sans", stack: "'Futura', 'Century Gothic', 'Avenir', sans-serif" },
  { label: "Humanist sans", stack: "'Segoe UI', 'Frutiger', 'Helvetica Neue', sans-serif" },
  { label: "Old-style serif", stack: "'Charter', 'Georgia', 'Times New Roman', serif" },
  { label: "Transitional serif", stack: "'Libre Baskerville', 'Georgia', serif" },
  { label: "Monospace", stack: "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace" },
  { label: "Console", stack: "'Lucida Console', 'Menlo', 'DejaVu Sans Mono', monospace" },
  { label: "Display", stack: "'Impact', 'Haettenschweiler', 'Arial Narrow Bold', sans-serif" },
  { label: "Rounded", stack: "'Nunito', 'Segoe UI', system-ui, sans-serif" },
  { label: "Handwriting", stack: "'Segoe Script', 'Comic Sans MS', cursive" },
]

export type FontPickerProps = {
  modelValue?: string
  onUpdateModelValue?: (value: string) => void
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
}

export default function FontPicker(raw: FontPickerProps) {
  const props = mergeProps({ disabled: false }, raw)
  return (
    <div
      role="radiogroup"
      aria-label="Font"
      class={cn(styles.grid, props.disabled && styles.pointerEventsNone, props.xstyle, props.class)}
    >
      <For each={FONT_STACKS}>
        {(font) => (
          <label
            class={cn([styles.flex, props.modelValue === font.stack ? styles.bgAccent15 : styles.textMutedForeground])}
          >
            <input
              {...stylex.props(styles.input)}
              type="radio"
              name="dk-font-picker"
              value={font.stack}
              checked={props.modelValue === font.stack}
              disabled={props.disabled}
              onChange={() => props.onUpdateModelValue?.(font.stack)}
            />
            <span {...stylex.props(styles.text)} style={{ "font-family": font.stack }}>
              {font.label}
            </span>
            <span {...stylex.props(styles.text2)}>Aa 123</span>
          </label>
        )}
      </For>
    </div>
  )
}
