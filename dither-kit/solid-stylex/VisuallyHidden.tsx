// Generated from ../solid/VisuallyHidden.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps, splitProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: {
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
  focusNotSrOnly: {
    position: { default: null, ":focus": "fixed" },
    width: { default: null, ":focus": "auto" },
    height: { default: null, ":focus": "auto" },
    padding: { default: null, ":focus": "0" },
    margin: { default: null, ":focus": "0" },
    overflow: { default: null, ":focus": "visible" },
    clipPath: { default: null, ":focus": "none" },
    whiteSpace: { default: null, ":focus": "normal" },
    top: { default: null, ":focus": "0.5rem" },
    left: { default: null, ":focus": "0.5rem" },
    zIndex: { default: null, ":focus": "50" },
    borderRadius: { default: null, ":focus": "0.25rem" },
    borderStyle: { default: null, ":focus": "solid" },
    borderWidth: { default: null, ":focus": "1px" },
    backgroundColor: { default: null, ":focus": "var(--background)" },
    paddingInline: { default: null, ":focus": "0.5rem" },
    paddingBlock: { default: null, ":focus": "0.25rem" },
    fontSize: { default: null, ":focus": "11px" },
    color: { default: null, ":focus": "var(--foreground)" },
  },
})

/** Screen-reader-only content. `focusable` reveals it on keyboard focus with
 * skip-link styling — the pattern for "visible only to whom it matters", and
 * the a11y-floor alternative to `aria-label` when the label must also exist in
 * the reading order. */
type Own = {
  focusable?: boolean
  class?: string
  xstyle?: StyleProp
}
const OWN = ["focusable", "class", "xstyle", "children"] as const satisfies readonly (keyof Own | "children")[]

/** Everything a `<span>` takes (a `tabindex`, listeners, ARIA) reaches it. */
export type VisuallyHiddenProps = Own & Omit<JSX.HTMLAttributes<HTMLSpanElement>, keyof Own>

export default function VisuallyHidden(raw: VisuallyHiddenProps) {
  const merged = mergeProps({ focusable: false }, raw)
  const [props, rest] = splitProps(merged, OWN)

  return (
    <span {...rest} class={cn(styles.text, props.focusable && styles.focusNotSrOnly, props.xstyle, props.class)}>
      {props.children}
    </span>
  )
}
