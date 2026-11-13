// Generated from @dither-ui/kit/solid/Code.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import type { JSX } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  code: {
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 60%, transparent)",
    paddingInline: "0.25rem",
    paddingBlock: "1px",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "color-mix(in oklab, var(--foreground) 90%, transparent)",
  },
})

export type CodeProps = { class?: string; xstyle?: StyleProp; children?: JSX.Element }

/** Inline code — the `<code>` element in house chrome (small radius, card
 * fill). For the copyable, highlighted block see CodeBlock in the app layer. */
export default function Code(props: CodeProps) {
  return <code class={cn(styles.code, props.xstyle, props.class)}>{props.children}</code>
}
