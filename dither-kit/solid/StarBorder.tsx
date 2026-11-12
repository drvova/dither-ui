import { createMemo, type JSX, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import "./StarBorder.css"

export type StarBorderProps = {
  color?: string
  speed?: number
  thickness?: number
  class?: string
  children?: JSX.Element
}

export default function StarBorder(raw: StarBorderProps) {
  const props = mergeProps({ color: "#7CFF67", speed: 6, thickness: 1 }, raw)

  const glint = createMemo(() => `radial-gradient(circle, ${props.color}, transparent 12%)`)

  return (
    <div
      class={cn("dither-star-border relative inline-block overflow-hidden rounded-[14px]", props.class)}
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
      <div class="relative z-[1] rounded-[13px] bg-background px-4 py-2">{props.children}</div>
    </div>
  )
}
