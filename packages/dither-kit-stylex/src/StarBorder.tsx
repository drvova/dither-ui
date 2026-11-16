// Generated from @dither-ui/kit/solid/StarBorder.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/StarBorder.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: {
    position: "relative",
    zIndex: "1",
    borderRadius: "13px",
    backgroundColor: "var(--background)",
    paddingInline: "1rem",
    paddingBlock: "0.5rem",
  },
  frame2: { position: "relative", display: "inline-block", overflow: "hidden", borderRadius: "14px" },
})

export type StarBorderProps = {
  /** @docs string (hex) */
  color?: string
  /** @docs number (s) */
  speed?: number
  /** @docs number (px) */
  thickness?: number
  class?: string
  xstyle?: StyleProp
  /** @docs content */
  children?: JSX.Element
}

export default function StarBorder(raw: StarBorderProps) {
  const props = mergeProps({ color: "#7CFF67", speed: 6, thickness: 1 }, raw)

  const glint = createMemo(() => `radial-gradient(circle, ${props.color}, transparent 12%)`)

  return (
    <div
      class={cn([styles.frame2, "dither-star-border"], props.xstyle, props.class)}
      style={{ padding: `${props.thickness}px` }}
    >
      <span
        class="star-strip star-bottom"
        style={{ background: glint(), "animation-duration": `${props.speed}s` }}
        aria-hidden="true"
      />
      <span
        class="star-strip star-top"
        style={{ background: glint(), "animation-duration": `${props.speed}s` }}
        aria-hidden="true"
      />
      <div {...stylex.props(styles.frame)}>{props.children}</div>
    </div>
  )
}
