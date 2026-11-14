// Generated from @dither-ui/kit/solid/DitherScrollArea.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import type { JSX } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/DitherScrollArea.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: { overflow: "auto" },
})

export type DitherScrollAreaProps = {
  /** @default undefined */
  class?: string
  xstyle?: StyleProp
  /** @docs content */
  children?: JSX.Element
}

export default function DitherScrollArea(props: DitherScrollAreaProps) {
  return <div class={cn([styles.box, "dk-scroll"], props.xstyle, props.class)}>{props.children}</div>
}
