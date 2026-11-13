// Generated from dither-kit/solid/FuzzyText.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createUniqueId, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "dither-kit/solid/FuzzyText.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  svg: { position: "absolute" },
  frame: { position: "relative", display: "inline-block" },
})

export type FuzzyTextProps = {
  text?: string
  intensity?: number
  class?: string
  xstyle?: StyleProp
}

export default function FuzzyText(raw: FuzzyTextProps) {
  const props = mergeProps({ text: "FUZZY", intensity: 4 }, raw)

  // One id for the server's markup and the client's.
  const uid = `dither-fuzz-${createUniqueId()}`

  return (
    <span class={cn([styles.frame, "dither-fuzzy"], props.xstyle, props.class)} aria-label={props.text}>
      {/* SVG turbulence + displacement drives an analog fuzz; native, no canvas */}
      <svg width="0" height="0" {...stylex.props(styles.svg)} aria-hidden="true">
        <defs>
          <filter id={uid} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.4" numOctaves="2" seed="7" result="n">
              <animate
                attributeName="baseFrequency"
                dur="1.6s"
                values="0.012 0.4;0.02 0.55;0.012 0.4"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="n"
              scale={props.intensity}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <span aria-hidden="true" style={{ filter: `url(#${uid})` }}>
        {props.text}
      </span>
    </span>
  )
}
