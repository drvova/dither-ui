import { DitherOverline } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherOverline>Chapter 02</DitherOverline>
}

export const meta = defineExample({
  component: DitherOverline,
  title: "Overline",
  studio: { group: "display", frame: { w: 240, h: 80 }, controls: { tone: {} } },
})
