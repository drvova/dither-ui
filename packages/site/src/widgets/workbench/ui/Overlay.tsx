// The overlay's one SVG layer, in stage px: guides and the layout grid,
// the measuring marks, the annotations (strokes, arrows, notes, comment
// pins: the group the "Copy annotations as SVG" export serialises), what
// is being drawn with the selection's chrome, and the rulers on top (their
// grounds the only part that takes a press). Every stroke keeps its width
// on the screen whatever scales the stage (`vector-effect`). Decorative:
// the readout under the stage says it in words.
import { createUniqueId, onMount, Show } from "solid-js"
import { ANNOTATIONS, measureFace } from "@/widgets/workbench/model/svg"
import { useBench } from "../context"
import { Pins } from "./Comments"
import Guides from "./Guides"
import Ink, { Drawings } from "./Ink"
import Marks from "./Marks"
import { NoteShapes } from "./Notes"
import Rulers from "./Rulers"
import "./Overlay.css"

export default function Overlay() {
  const b = useBench()
  const hatch = `wb-hatch-${createUniqueId()}`
  let svg: SVGSVGElement | undefined
  onMount(() => svg && measureFace(getComputedStyle(svg).fontFamily))

  return (
    <svg
      ref={(el) => (svg = el)}
      class="wb-layer layer-scope"
      width={b.size().w}
      height={b.size().h}
      viewBox={`0 0 ${b.size().w} ${b.size().h}`}
      aria-hidden="true"
    >
      <defs>
        <pattern id={hatch} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0.5 0V5" class="hatch" />
        </pattern>
      </defs>
      <Guides />
      <Marks hatch={hatch} />
      <g class={ANNOTATIONS}>
        <Drawings />
        <NoteShapes />
        <Pins />
      </g>
      <Ink />
      <Show when={b.toggles.rulers}>
        <Rulers />
      </Show>
    </svg>
  )
}
