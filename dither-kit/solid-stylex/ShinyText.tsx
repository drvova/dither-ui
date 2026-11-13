// Generated from ../solid/ShinyText.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "../solid/ShinyText.css"

export type ShinyTextProps = {
  speed?: number
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  children?: JSX.Element
}

export default function ShinyText(raw: ShinyTextProps) {
  const props = mergeProps({ speed: 1, disabled: false }, raw)

  const dur = createMemo(() => `${Math.max(0.4, 5 / Math.max(0.01, props.speed))}s`)

  return (
    <span
      class={cn("dither-shiny-text", props.xstyle, props.class)}
      style={{ "animation-duration": dur(), "animation-play-state": props.disabled ? "paused" : "running" }}
    >
      {props.children}
    </span>
  )
}
