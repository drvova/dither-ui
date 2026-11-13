// Generated from dither-kit/solid/InputGroup.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import type { JSX } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { flexShrink: "0", fontSize: "12px", color: "var(--muted-foreground)" },
  row: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: "0.375rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: { default: "var(--border)", ":focus-within": "var(--ring)" },
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.5rem",
    transitionProperty: { default: "border-color, box-shadow", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
})

/** Addon slots around a control — prefix/suffix text, icons or buttons in
 * one bordered group. The inner control drops its own chrome (the docs
 * snippet shows the exact class set); the group owns the border and the
 * focus-within ring. */
export type InputGroupProps = {
  class?: string
  xstyle?: StyleProp
  prefix?: JSX.Element
  suffix?: JSX.Element
  children?: JSX.Element
}

export default function InputGroup(props: InputGroupProps) {
  return (
    <div class={cn(styles.row, props.xstyle, props.class)}>
      <span {...stylex.props(styles.text)}>{props.prefix}</span>
      {props.children}
      <span {...stylex.props(styles.text)}>{props.suffix}</span>
    </div>
  )
}
