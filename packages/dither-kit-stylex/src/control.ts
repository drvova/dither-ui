// Generated from @dither-ui/kit/tailwind/control.ts by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  control: {
    minHeight: "2.5rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: {
      default: "var(--border)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 25%, transparent)",
      },
      ":focus-visible": "var(--ring)",
    },
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--foreground)",
    transitionProperty: {
      default: "border-color, box-shadow, background-color",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    outlineStyle: "none",
    "::placeholder": { color: "var(--placeholder, var(--muted-foreground))" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  controlInvalid: { boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" } },
  controlButton: {
    boxShadow: {
      default: null,
      ":focus-visible": "0 0 0 2px var(--background), 0 0 0 calc(2px + 2px) var(--ring)",
    },
    outlineStyle: { default: null, ":focus-visible": "none" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  popover: {
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 80%, transparent)",
    backgroundColor: "var(--card)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.32)",
  },
})

export const CONTROL = styles.control
/** A field drawn invalid keeps its edge in the signal ink as it takes focus
 * (the edge is its style, which no focus class outranks): focus rings it in
 * the ring ink instead. */
export const CONTROL_INVALID = styles.controlInvalid
export const CONTROL_BUTTON = styles.controlButton
export const POPOVER = styles.popover
