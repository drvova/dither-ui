// A word in the pixel face (`pixel-type.ts`), `cell` px a cell, in the
// current ink: the kit's parts' names, chunky. It stands on the line's
// seven rows; a descender hangs under them, into the room below. Decorative:
// its heading carries the name as text.
import { createMemo, For, mergeProps } from "solid-js"
import { layoutPixelText, PIXEL_ROWS } from "@/pages/landing/pixel-type"

export type PixelWordProps = { text: string; cell?: number }

export default function PixelWord(raw: PixelWordProps) {
  const props = mergeProps({ cell: 5 }, raw)
  const laid = createMemo(() => layoutPixelText(props.text))
  return (
    <svg
      viewBox={`0 0 ${laid().width} ${PIXEL_ROWS}`}
      width={laid().width * props.cell}
      height={PIXEL_ROWS * props.cell}
      aria-hidden="true"
      {...{ focusable: "false" }}
      shape-rendering="crispEdges"
      overflow="visible"
    >
      <For each={laid().cells}>{(c) => <rect x={c.x} y={c.y} width="1" height="1" fill="currentColor" />}</For>
    </svg>
  )
}
