import { DitherHighlight } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherHighlight>highlighted inline</DitherHighlight>
}

export const meta = defineExample({
  component: DitherHighlight,
  title: "Highlight",
  studio: { group: "display", frame: { w: 260, h: 80 }, controls: {} },
})
