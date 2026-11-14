import { createMemo, type JSX, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"

export type DitherGridProps = {
  /** Minimum card width; columns auto-fit. Ignored when cols is set.
   * @docs number (minimum card width, columns auto-fit) */
  min?: number
  /** Fixed column count — for deliberate layouts.
   * @docs number (fixed column count, overrides min) */
  cols?: number
  /** Grid gap, any CSS length.
   * @docs string (any CSS length) */
  gap?: string
  class?: string
  /** @docs content */
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
    <div class={cn("grid", props.class)} style={style()}>
      {props.children}
    </div>
  )
}
