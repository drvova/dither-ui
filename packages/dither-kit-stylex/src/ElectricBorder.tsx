// Generated from @dither-ui/kit/solid/ElectricBorder.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createUniqueId, type JSX, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/ElectricBorder.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  svg: { position: "absolute" },
  layer: { pointerEvents: "none", position: "absolute", inset: "0px", borderRadius: "12px" },
  frame: { position: "relative" },
  frame2: {
    position: "relative",
    display: "inline-block",
    borderRadius: "12px",
    paddingInline: "1rem",
    paddingBlock: "0.5rem",
  },
})

export type ElectricBorderProps = {
  color?: string
  speed?: number
  thickness?: number
  class?: string
  xstyle?: StyleProp
  children?: JSX.Element
}

export default function ElectricBorder(raw: ElectricBorderProps) {
  const props = mergeProps({ color: "#5227FF", speed: 1, thickness: 2 }, raw)

  const uid = `dither-electric-${createUniqueId()}`
  const dur = createMemo(() => `${2 / Math.max(0.1, props.speed)}s`)

  return (
    <div class={cn([styles.frame2, "dk-electric-border"], props.xstyle, props.class)}>
      {/* 0x0 filter host: turbulence displaces the overlay border into an arc */}
      <svg width="0" height="0" {...stylex.props(styles.svg)} aria-hidden="true">
        <defs>
          <filter id={uid} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" seed="3" result="n">
              <animate attributeName="seed" from="0" to="12" dur={dur()} repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="n" scale={props.thickness * 3} />
          </filter>
        </defs>
      </svg>
      <div
        {...stylex.props(styles.layer)}
        style={{ border: `${props.thickness}px solid ${props.color}`, filter: `url(#${uid})` }}
        aria-hidden="true"
      />
      <div {...stylex.props(styles.frame)}>{props.children}</div>
    </div>
  )
}
