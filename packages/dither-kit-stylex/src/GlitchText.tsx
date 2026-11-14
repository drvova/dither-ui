// Generated from @dither-ui/kit/solid/GlitchText.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/GlitchText.css"

export type GlitchTextProps = {
  text?: string
  speed?: number
  /** @default undefined */
  class?: string
  xstyle?: StyleProp
}

export default function GlitchText(raw: GlitchTextProps) {
  const props = mergeProps({ text: "GLITCH", speed: 1 }, raw)

  const dur = createMemo(() => `${Math.max(0.3, 2.5 / Math.max(0.01, props.speed))}s`)

  return (
    <span
      class={cn("dither-glitch", props.xstyle, props.class)}
      data-text={props.text}
      style={{ "--dither-glitch-dur": dur() }}
    >
      {props.text}
    </span>
  )
}
