// Generated from dither-kit/solid/Highlight.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import type { JSX } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  mark: {
    borderRadius: "calc(var(--radius) - 2px)",
    backgroundColor: "color-mix(in oklab, var(--foreground) 10%, transparent)",
    paddingInline: "0.125rem",
    color: "inherit",
  },
})

/** Inline highlight: the `<mark>` element with a neutral token wash (the
 * colored variants ride in `class`). Neutral because house color comes from
 * palette seeds, not hardcoded accents. */
export type HighlightProps = { class?: string; xstyle?: StyleProp; children?: JSX.Element }

export default function Highlight(props: HighlightProps) {
  return <mark class={cn(styles.mark, props.xstyle, props.class)}>{props.children}</mark>
}
