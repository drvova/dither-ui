import { createMemo, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import "./GlitchText.css"

export type GlitchTextProps = {
  text?: string
  speed?: number
  /** @default undefined */
  class?: string
}

export default function GlitchText(raw: GlitchTextProps) {
  const props = mergeProps({ text: "GLITCH", speed: 1 }, raw)

  const dur = createMemo(() => `${Math.max(0.3, 2.5 / Math.max(0.01, props.speed))}s`)

  return (
    <span class={cn("dither-glitch", props.class)} data-text={props.text} style={{ "--dither-glitch-dur": dur() }}>
      {props.text}
    </span>
  )
}
