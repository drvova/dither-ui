// Generated from ../solid/DitherCanvas.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: { pointerEvents: "none", position: "absolute", inset: "0px", opacity: "40%" },
  frame: { position: "relative" },
  frame2: {
    position: "relative",
    minHeight: "0px",
    overflow: "auto",
    backgroundColor: "color-mix(in oklab, var(--background) 40%, transparent)",
  },
})

export type DitherCanvasProps = {
  pattern?: "dots" | "grid" | "plain"
  /** Pattern pitch in CSS pixels. */
  cell?: number
  class?: string
  xstyle?: StyleProp
  children?: JSX.Element
}

/** Work-surface backdrop — the dotted or ruled field a dashboard sits on.
 * Pure CSS: the pattern inks with the border token and stays behind content. */
export default function DitherCanvas(raw: DitherCanvasProps) {
  const props = mergeProps({ pattern: "dots" as const, cell: 16 }, raw)
  const layer = createMemo<JSX.CSSProperties>(() => {
    const c = `${props.cell}px`
    if (props.pattern === "dots")
      return {
        "background-image": "radial-gradient(var(--border) 1px, transparent 1px)",
        "background-size": `${c} ${c}`,
      }
    if (props.pattern === "grid")
      return {
        "background-image":
          "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        "background-size": `${c} ${c}`,
      }
    return {}
  })
  return (
    <div class={cn(styles.frame2, props.xstyle, props.class)}>
      <div aria-hidden="true" {...stylex.props(styles.layer)} style={layer()} />
      <div {...stylex.props(styles.frame)}>{props.children}</div>
    </div>
  )
}
