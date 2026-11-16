import { DitherCaption } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <>
      <DitherCaption>Uploaded 3 minutes ago</DitherCaption>
      <DitherCaption tone="faint">auto-saved</DitherCaption>
    </>
  )
}

export const meta = defineExample({
  component: DitherCaption,
  title: "Caption",
  studio: { group: "display", frame: { w: 240, h: 80 }, controls: { tone: {} } },
})
