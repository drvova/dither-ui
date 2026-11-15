import { DitherAsciiText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherAsciiText text="DITHER" />
}

export const meta = defineExample({
  component: DitherAsciiText,
  title: "ASCII text",
  studio: { group: "display", frame: { w: 320, h: 150 }, controls: { text: {}, cols: { min: 8, max: 160, step: 4 } } },
})
