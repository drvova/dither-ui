// Generated from @dither-ui/kit/solid/CircularText.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createUniqueId, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/CircularText.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  svg: { height: "100%", width: "100%" },
  grid: { display: "inline-grid", placeItems: "center" },
})

export type CircularTextProps = {
  text?: string
  duration?: number
  size?: number
  class?: string
  xstyle?: StyleProp
}

const R = 40
// Full circle as two arcs, drawn clockwise from the left point.
const d = `M 50 50 m -${R} 0 a ${R} ${R} 0 1 1 ${R * 2} 0 a ${R} ${R} 0 1 1 -${R * 2} 0`

export default function CircularText(raw: CircularTextProps) {
  const props = mergeProps({ text: "DITHER · UI · TOOLKIT · ", duration: 12, size: 170 }, raw)
  const uid = `dither-circle-${createUniqueId()}`
  return (
    <div
      class={cn(styles.grid, props.xstyle, props.class)}
      style={{ width: `${props.size}px`, height: `${props.size}px` }}
      aria-label={props.text}
    >
      <svg
        viewBox="0 0 100 100"
        class={cn(styles.svg, "dither-circular-svg")}
        style={{ "animation-duration": `${props.duration}s` }}
        aria-hidden="true"
      >
        <defs>
          <path id={uid} d={d} fill="none" />
        </defs>
        <text class="dither-circular-text">
          <textPath href={`#${uid}`} startOffset="0">
            {props.text}
          </textPath>
        </text>
      </svg>
    </div>
  )
}
