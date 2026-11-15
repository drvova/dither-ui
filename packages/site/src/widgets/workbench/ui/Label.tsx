// A label of the overlay's SVG layer: a filled box sized to its text (the
// mono face's width, `model/svg.ts`), the text centred in it. `x`/`y` is
// the point the box hangs from, `align`/`valign` which side of the box it is.
import { createMemo } from "solid-js"
import { textWidth } from "@/widgets/workbench/model/svg"

type LabelProps = {
  x: number
  y: number
  text: string | number
  /** Paint (`Overlay.css`): `hl` the highlight, `guide` the guide colour,
   * `ring` the guide ink on the ground. */
  tone: "hl" | "guide" | "ring"
  size?: number
  pad?: [number, number]
  align?: "start" | "middle" | "end"
  valign?: "top" | "middle" | "bottom"
  radius?: number
}

export default function Label(props: LabelProps) {
  const box = createMemo(() => {
    const size = props.size ?? 9
    const [py, px] = props.pad ?? [1, 4]
    const w = textWidth(String(props.text), size) + px * 2
    const h = size + 2 + py * 2
    const x = props.align === "middle" ? props.x - w / 2 : props.align === "end" ? props.x - w : props.x
    const y = props.valign === "middle" ? props.y - h / 2 : props.valign === "bottom" ? props.y - h : props.y
    return { x, y, w, h, size }
  })
  return (
    <g class={`label ${props.tone}`}>
      <rect x={box().x} y={box().y} width={box().w} height={box().h} rx={props.radius ?? 3} />
      <text
        x={box().x + box().w / 2}
        y={box().y + box().h / 2}
        font-size={box().size}
        text-anchor="middle"
        dominant-baseline="central"
      >
        {props.text}
      </text>
    </g>
  )
}
