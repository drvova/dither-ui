// Generated from @dither-ui/kit/solid/DitherFieldset.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import type { JSX } from "solid-js"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  fieldset: {
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    padding: "1rem",
  },
  legend: {
    paddingInline: "0.375rem",
    fontSize: "11px",
    letterSpacing: "0.2em",
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
  },
  grid: { display: "grid", gap: "1rem" },
})

export type DitherFieldsetProps = {
  legend: string
  /** @docs content */
  children?: JSX.Element
}

export default function DitherFieldset(props: DitherFieldsetProps) {
  return (
    <fieldset {...stylex.props(styles.fieldset)}>
      <legend {...stylex.props(styles.legend)}>{props.legend}</legend>
      <div {...stylex.props(styles.grid)}>{props.children}</div>
    </fieldset>
  )
}
