import { DitherBox } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherBox>Box content</DitherBox>
}

export const meta = defineExample({
  component: DitherBox,
  title: "Box",
  studio: {
    group: "structure",
    frame: { w: 260, h: 110 },
    controls: { as: { kind: "select", options: ["div", "section", "span", "article"] } },
  },
})
