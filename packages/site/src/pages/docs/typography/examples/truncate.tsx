import { DitherTruncate } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherTruncate>a file name that clips in this box</DitherTruncate>
}

export const meta = defineExample({
  component: DitherTruncate,
  title: "Truncate",
  studio: {
    group: "display",
    frame: { w: 240, h: 80 },
    controls: { as: { kind: "select", options: ["span", "div"] }, title: { demo: "" } },
  },
})
