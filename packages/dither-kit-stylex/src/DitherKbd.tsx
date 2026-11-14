// Generated from @dither-ui/kit/solid/DitherKbd.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
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

export type DitherKbdProps = {
  /** @default undefined */
  class?: string
  xstyle?: StyleProp
  /** @docs content */
  children?: JSX.Element
}

export default function DitherKbd(props: DitherKbdProps) {
  return (
    <kbd class={cn(styles.kbd, props.xstyle, props.class)} style={{ "border-bottom-width": "2px" }}>
      {props.children}
    </kbd>
  )
}
