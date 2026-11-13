// Generated from dither-kit/solid/Label.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps, Show, splitProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { color: "var(--muted-foreground)" },
  label: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "12px",
    color: "var(--foreground)",
  },
})

type Own = { required?: boolean; class?: string; xstyle?: StyleProp }

/** Everything a `<label>` takes (`for` first of all) reaches the label. */
export type LabelProps = Own & Omit<JSX.LabelHTMLAttributes<HTMLLabelElement>, keyof Own>

/** A real `<label>` — pairs with controls through the `for` attr (or by
 * nesting), which is the whole point over a styled span. */
export default function Label(raw: LabelProps) {
  const merged = mergeProps({ required: false }, raw)
  const [props, rest] = splitProps(merged, ["required", "class", "xstyle", "children"])
  return (
    <label {...rest} class={cn(styles.label, props.xstyle, props.class)}>
      {props.children}
      <Show when={props.required}>
        <span {...stylex.props(styles.text)} aria-hidden="true">
          *
        </span>
      </Show>
    </label>
  )
}
