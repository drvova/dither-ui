import { createMemo, type JSX, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"

export type DitherCanvasProps = {
  pattern?: "dots" | "grid" | "plain"
  /** Pattern pitch in CSS pixels.
   * @docs number (pattern pitch in px) */
  cell?: number
  class?: string
  /** @docs content */
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
    <div class={cn("relative min-h-0 overflow-auto bg-background/40", props.class)}>
      <div aria-hidden="true" class="pointer-events-none absolute inset-0 opacity-40" style={layer()} />
      <div class="relative">{props.children}</div>
    </div>
  )
}
