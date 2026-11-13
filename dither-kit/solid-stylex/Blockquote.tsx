// Generated from ../solid/Blockquote.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import type { JSX } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  blockquote: {
    borderLeftStyle: "solid",
    borderLeftWidth: "2px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingLeft: "1rem",
    fontSize: "13px",
    lineHeight: "1.625",
    color: "var(--muted-foreground)",
  },
})

export type BlockquoteProps = { class?: string; xstyle?: StyleProp; children?: JSX.Element }

/** Quoted aside: real `<blockquote>` semantics with the editorial treatment —
 * hairline left rule, muted register. Cite lives in the children (or the
 * `cite` attr). */
export default function Blockquote(props: BlockquoteProps) {
  return <blockquote class={cn(styles.blockquote, props.xstyle, props.class)}>{props.children}</blockquote>
}
