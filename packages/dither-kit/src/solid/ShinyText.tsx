import { createMemo, type JSX, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import "./ShinyText.css"

export type ShinyTextProps = {
  speed?: number
  disabled?: boolean
  /** @default undefined */
  class?: string
  /** @docs text */
  children?: JSX.Element
}

export default function ShinyText(raw: ShinyTextProps) {
  const props = mergeProps({ speed: 1, disabled: false }, raw)

  const dur = createMemo(() => `${Math.max(0.4, 5 / Math.max(0.01, props.speed))}s`)

  return (
    <span
      class={cn("dither-shiny-text", props.class)}
      style={{ "animation-duration": dur(), "animation-play-state": props.disabled ? "paused" : "running" }}
    >
      {props.children}
    </span>
  )
}
