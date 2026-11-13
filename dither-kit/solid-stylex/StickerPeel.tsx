// Generated from ../solid/StickerPeel.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import type { JSX } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "../solid/StickerPeel.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", zIndex: "1" },
  layer: { pointerEvents: "none", position: "absolute", right: "0px", bottom: "0px" },
  frame2: { position: "relative", display: "inline-block" },
})

export type StickerPeelProps = { class?: string; xstyle?: StyleProp; children?: JSX.Element }

export default function StickerPeel(props: StickerPeelProps) {
  return (
    <div class={cn([styles.frame2, "dither-sticker"], props.xstyle, props.class)}>
      <div {...stylex.props(styles.frame)}>{props.children}</div>
      <div class={cn(styles.layer, "dither-peel")} aria-hidden="true" />
    </div>
  )
}
