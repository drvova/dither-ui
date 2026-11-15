import { DitherBlockquote } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherBlockquote>The threshold is the style.</DitherBlockquote>
}

export const meta = defineExample({
  component: DitherBlockquote,
  title: "Blockquote",
  studio: { group: "display", frame: { w: 320, h: 120 }, controls: {} },
})
