// Generated from dither-kit/solid/PixelTransition.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, Index, type JSX, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "dither-kit/solid/PixelTransition.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: { pointerEvents: "none", position: "absolute", inset: "0px", display: "grid" },
  frame: { position: "relative", overflow: "hidden" },
})

export type PixelTransitionProps = {
  rows?: number
  cols?: number
  color?: string
  class?: string
  xstyle?: StyleProp
  children?: JSX.Element
}

// Deterministic per-cell delay so the dissolve order is stable.
function seeded(i: number) {
  const s = Math.sin(i * 43.21) * 1000
  return s - Math.floor(s)
}

export default function PixelTransition(raw: PixelTransitionProps) {
  const props = mergeProps({ rows: 6, cols: 10, color: "#111318" }, raw)
  const cells = createMemo(() =>
    Array.from({ length: Math.max(1, props.rows * props.cols) }, (_, i) => seeded(i) * 300),
  )

  return (
    <div class={cn([styles.frame, "dither-pixeltrans"], props.xstyle, props.class)}>
      {props.children}
      <div
        {...stylex.props(styles.grid)}
        style={{
          "grid-template-columns": `repeat(${props.cols}, 1fr)`,
          "grid-template-rows": `repeat(${props.rows}, 1fr)`,
        }}
        aria-hidden="true"
      >
        <Index each={cells()}>
          {(delay) => (
            <span class="dither-cell" style={{ background: props.color, "transition-delay": `${delay()}ms` }} />
          )}
        </Index>
      </div>
    </div>
  )
}
