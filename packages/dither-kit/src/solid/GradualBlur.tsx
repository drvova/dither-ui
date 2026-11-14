import { createMemo, type JSX, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"

export type GradualBlurProps = {
  position?: "bottom" | "top"
  /** @docs number (px) */
  height?: number
  /** @docs number (px) */
  strength?: number
  class?: string
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
    <div class={cn("relative", props.class)}>
      {props.children}
      <div
        class={`pointer-events-none absolute inset-x-0 ${props.position === "top" ? "top-0" : "bottom-0"}`}
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
