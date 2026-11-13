import { createUniqueId, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import "./CircularText.css"

export type CircularTextProps = {
  text?: string
  duration?: number
  size?: number
  class?: string
}

const R = 40
// Full circle as two arcs, drawn clockwise from the left point.
const d = `M 50 50 m -${R} 0 a ${R} ${R} 0 1 1 ${R * 2} 0 a ${R} ${R} 0 1 1 -${R * 2} 0`

export default function CircularText(raw: CircularTextProps) {
  const props = mergeProps({ text: "DITHER · UI · TOOLKIT · ", duration: 12, size: 170 }, raw)
  const uid = `dither-circle-${createUniqueId()}`
  return (
    <div
      class={cn("inline-grid place-items-center", props.class)}
      style={{ width: `${props.size}px`, height: `${props.size}px` }}
      aria-label={props.text}
    >
      <svg
        viewBox="0 0 100 100"
        class="dither-circular-svg h-full w-full"
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
