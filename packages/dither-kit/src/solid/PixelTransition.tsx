import { createMemo, Index, type JSX, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import "./PixelTransition.css"

export type PixelTransitionProps = {
  rows?: number
  cols?: number
  color?: string
  class?: string
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
    <div class={cn("dither-pixeltrans relative overflow-hidden", props.class)}>
      {props.children}
      <div
        class="pointer-events-none absolute inset-0 grid"
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
