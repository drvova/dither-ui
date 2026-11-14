// The brand mark: the 7x7 dithered diamond, ember core, `size` px square;
// given `cells`, another mark on the same grid in the same hand (the close
// mark). Decorative: its link or its place names it.
import { For, type JSX, mergeProps, splitProps } from "solid-js"
import { MARK_CELLS } from "@/shared/ui/brand-mark"

type Own = { size: number; cells?: readonly { x: number; y: number; core?: boolean }[] }
type BrandMarkProps = Own & Omit<JSX.SvgSVGAttributes<SVGSVGElement>, keyof Own>

export default function BrandMark(raw: BrandMarkProps) {
  const merged = mergeProps({ cells: MARK_CELLS as NonNullable<Own["cells"]> }, raw)
  const [props, rest] = splitProps(merged, ["size", "cells"])
  return (
    <svg
      {...rest}
      viewBox="0 0 7 7"
      width={props.size}
      height={props.size}
      aria-hidden="true"
      {...{ focusable: "false" }}
      shape-rendering="crispEdges"
    >
      <For each={props.cells}>
        {(c) => (
          <rect
            x={c.x}
            y={c.y}
            width="1"
            height="1"
            fill={c.core ? "var(--signal, var(--swatch-orange))" : "currentColor"}
          />
        )}
      </For>
    </svg>
  )
}
