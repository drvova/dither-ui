import { DitherHeading, DitherOverline } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="text-left">
      <DitherOverline>Chapter 02</DitherOverline>
      <DitherHeading class="mt-1" level="2">
        The renderer
      </DitherHeading>
    </div>
  )
}

export const meta = defineExample({
  component: DitherOverline,
  title: "Overline",
  studio: { group: "display", frame: { w: 240, h: 80 }, controls: { tone: {} } },
})
