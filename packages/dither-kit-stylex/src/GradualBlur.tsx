// Generated from @dither-ui/kit/solid/GradualBlur.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative" },
  pointerEventsNone: { pointerEvents: "none", position: "absolute", insetInline: "0px" },
  top0: { top: "0px" },
  bottom0: { bottom: "0px" },
})

export type GradualBlurProps = {
  position?: "bottom" | "top"
  /** @docs number (px) */
  height?: number
  /** @docs number (px) */
  strength?: number
  class?: string
  xstyle?: StyleProp
  /** @docs content */
  children?: JSX.Element
}

export default function GradualBlur(raw: GradualBlurProps) {
  const props = mergeProps({ position: "bottom" as const, height: 96, strength: 4 }, raw)

  // Progressive edge blur (iOS-style): a masked backdrop-filter strip so content
  // dissolves toward the chosen edge.
  const mask = createMemo(() =>
    props.position === "top"
      ? "linear-gradient(to bottom, black, transparent)"
      : "linear-gradient(to top, black, transparent)",
  )

  return (
    <div class={cn(styles.frame, props.xstyle, props.class)}>
      {props.children}
      <div
        class={cn([styles.pointerEventsNone, props.position === "top" ? styles.top0 : styles.bottom0])}
        style={{
          height: `${props.height}px`,
          "backdrop-filter": `blur(${props.strength}px)`,
          "-webkit-backdrop-filter": `blur(${props.strength}px)`,
          "mask-image": mask(),
          "-webkit-mask-image": mask(),
        }}
      />
    </div>
  )
}
