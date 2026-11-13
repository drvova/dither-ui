// Generated from @dither-ui/kit/solid/GlareHover.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import type { JSX } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/GlareHover.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: { pointerEvents: "none", position: "absolute", inset: "0px" },
  frame: { position: "relative", display: "inline-block", overflow: "hidden", borderRadius: "12px" },
})

export type GlareHoverProps = { class?: string; xstyle?: StyleProp; children?: JSX.Element }

export default function GlareHover(props: GlareHoverProps) {
  return (
    <div class={cn([styles.frame, "dk-glare-hover dither-glare"], props.xstyle, props.class)}>
      {props.children}
      <div class={cn(styles.layer, "glare")} aria-hidden="true" />
    </div>
  )
}
