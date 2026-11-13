// Generated from dither-kit/solid/Divider.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { mergeProps } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  wPx: {
    width: "1px",
    alignSelf: "stretch",
    backgroundColor: "color-mix(in oklab, var(--border) 60%, transparent)",
  },
  hPx: {
    height: "1px",
    width: "100%",
    borderStyle: "solid",
    borderWidth: "0px",
    backgroundColor: "color-mix(in oklab, var(--border) 60%, transparent)",
  },
})

export type DividerProps = {
  orientation?: "horizontal" | "vertical"
  class?: string
  xstyle?: StyleProp
}

/** Hairline rule. Horizontal renders a real `hr` (separator semantics come
 * for free); vertical is a flex-row citizen that stretches to the row height.
 * Both announce `role="separator"` with the right orientation. */
export default function Divider(raw: DividerProps) {
  const props = mergeProps({ orientation: "horizontal" as const }, raw)
  return (
    <Dynamic
      component={props.orientation === "vertical" ? "div" : "hr"}
      role="separator"
      aria-orientation={props.orientation}
      class={cn(props.orientation === "vertical" ? styles.wPx : styles.hPx, props.xstyle, props.class)}
    />
  )
}
