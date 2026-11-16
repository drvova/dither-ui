import { DitherHeading } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <>
      <DitherHeading level="2">Section title</DitherHeading>
      <DitherHeading level="3">Part title</DitherHeading>
      <DitherHeading level="4" class="text-muted-foreground">
        Quiet subhead
      </DitherHeading>
    </>
  )
}

export const meta = defineExample({
  component: DitherHeading,
  title: "Heading",
  studio: { group: "display", frame: { w: 280, h: 90 }, controls: { level: {} } },
})
