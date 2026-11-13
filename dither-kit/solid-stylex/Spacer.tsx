// Generated from ../solid/Spacer.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  shrink0: { flexShrink: "0" },
  spaceXsY: { height: "4px" },
  spaceXsX: { width: "4px" },
  spaceSmY: { height: "8px" },
  spaceSmX: { width: "8px" },
  spaceMdY: { height: "16px" },
  spaceMdX: { width: "16px" },
  spaceLgY: { height: "24px" },
  spaceLgX: { width: "24px" },
  spaceXlY: { height: "40px" },
  spaceXlX: { width: "40px" },
})

export type SpacerProps = {
  axis?: "x" | "y"
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  class?: string
  xstyle?: StyleProp
}

// Literal class strings so Tailwind ships every variant.
const SPACE = {
  xs: { y: styles.spaceXsY, x: styles.spaceXsX },
  sm: { y: styles.spaceSmY, x: styles.spaceSmX },
  md: { y: styles.spaceMdY, x: styles.spaceMdX },
  lg: { y: styles.spaceLgY, x: styles.spaceLgX },
  xl: { y: styles.spaceXlY, x: styles.spaceXlX },
} as const

/** Sized empty space for flex/grid rows — the alternative to magic margins.
 * `axis="y"` (default) is vertical room, `axis="x"` is horizontal. Purely
 * decorative: always aria-hidden. */
export default function Spacer(raw: SpacerProps) {
  const props = mergeProps({ axis: "y" as const, size: "md" as const }, raw)
  const classes = createMemo(() => cn(SPACE[props.size][props.axis], styles.shrink0, props.xstyle, props.class))
  return <div aria-hidden="true" class={classes()} />
}
