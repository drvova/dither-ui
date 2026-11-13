// Generated from @dither-ui/kit/solid/DitherGrid.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: { display: "grid" },
})

export type DitherGridProps = {
  /** Minimum card width; columns auto-fit. Ignored when cols is set. */
  min?: number
  /** Fixed column count — for deliberate layouts. */
  cols?: number
  /** Grid gap, any CSS length. */
  gap?: string
  class?: string
  xstyle?: StyleProp
  children?: JSX.Element
}

/** Dashboard grid — auto-fit card columns by minimum width, or a fixed
 * column count. Children span with plain col-span utilities. */
export default function DitherGrid(raw: DitherGridProps) {
  const props = mergeProps({ min: 240, gap: "0.75rem" }, raw)

  const style = createMemo<JSX.CSSProperties>(() => ({
    "grid-template-columns": props.cols
      ? `repeat(${props.cols}, minmax(0, 1fr))`
      : `repeat(auto-fit, minmax(min(100%, ${props.min}px), 1fr))`,
    gap: props.gap,
  }))

  return (
    <div class={cn(styles.grid, props.xstyle, props.class)} style={style()}>
      {props.children}
    </div>
  )
}
