// Generated from @dither-ui/kit/solid/GradientText.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/GradientText.css"

export type GradientTextProps = {
  colors?: string[]
  speed?: number
  class?: string
  xstyle?: StyleProp
  children?: JSX.Element
}

export default function GradientText(raw: GradientTextProps) {
  const props = mergeProps({ colors: ["#358ff3", "#7CFF67", "#358ff3"], speed: 1 }, raw)

  const bg = createMemo(
    () => `linear-gradient(90deg, ${(props.colors.length ? props.colors : ["#ffffff"]).join(", ")})`,
  )
  const dur = createMemo(() => `${Math.max(0.2, 6 / Math.max(0.01, props.speed))}s`)

  return (
    <span
      class={cn("dither-gradient-text", props.xstyle, props.class)}
      style={{ "background-image": bg(), "animation-duration": dur() }}
    >
      {props.children}
    </span>
  )
}
