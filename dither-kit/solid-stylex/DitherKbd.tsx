// Generated from ../solid/DitherKbd.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import type { JSX } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  kbd: {
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--background)",
    paddingInline: "0.375rem",
    paddingBlock: "0.125rem",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--foreground)",
  },
})

export type DitherKbdProps = { class?: string; xstyle?: StyleProp; children?: JSX.Element }

export default function DitherKbd(props: DitherKbdProps) {
  return (
    <kbd class={cn(styles.kbd, props.xstyle, props.class)} style={{ "border-bottom-width": "2px" }}>
      {props.children}
    </kbd>
  )
}
