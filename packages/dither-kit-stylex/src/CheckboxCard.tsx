// Generated from @dither-ui/kit/solid/CheckboxCard.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps, Show } from "solid-js"
import { cn, type StyleProp } from "./lib"
import DitherCheckbox from "./DitherCheckbox"
import "@dither-ui/kit/solid/CheckboxCard.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  checkbox: { marginTop: "0.125rem" },
  grid: { display: "grid", gap: "0.25rem" },
  text: { fontSize: "13px", lineHeight: "1", fontWeight: "500", color: "var(--foreground)" },
  text2: { fontSize: "12px", lineHeight: "1.375", color: "var(--muted-foreground)" },
  label: {
    display: "flex",
    cursor: "pointer",
    alignItems: "flex-start",
    gap: "0.75rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: {
      default: "color-mix(in oklab, var(--border) 70%, transparent)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 30%, transparent)",
      },
    },
    backgroundColor: "color-mix(in oklab, var(--card) 40%, transparent)",
    padding: "0.75rem",
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
})

export type CheckboxCardProps = {
  /** @docs boolean (with onUpdateModelValue)
   * @default false */
  modelValue?: boolean
  label?: string
  /** @default "" */
  description?: string
  onUpdateModelValue?: (value: boolean) => void
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  /** @docs content */
  children?: JSX.Element
}

/** The whole card is the checkbox's label — title and description ride
 * along, one click anywhere toggles, the peer focus ring shows keyboard
 * focus. Checkbox stays the source of truth (native semantics preserved). */
export default function CheckboxCard(raw: CheckboxCardProps) {
  const props = mergeProps({ label: "", disabled: false }, raw)
  return (
    <label
      class={cn([styles.label, "dk-check-card"], props.disabled && styles.pointerEventsNone, props.xstyle, props.class)}
    >
      <DitherCheckbox
        modelValue={props.modelValue ?? false}
        disabled={props.disabled}
        xstyle={styles.checkbox}
        onUpdateModelValue={(value) => props.onUpdateModelValue?.(value)}
      />
      <span {...stylex.props(styles.grid)}>
        <Show when={props.label}>
          <span {...stylex.props(styles.text)}>{props.label}</span>
        </Show>
        <Show when={props.description}>
          <span {...stylex.props(styles.text2)}>{props.description}</span>
        </Show>
        <span {...stylex.props(styles.text2)}>{props.children}</span>
      </span>
    </label>
  )
}
