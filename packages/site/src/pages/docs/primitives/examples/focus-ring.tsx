import { DitherFocusRing } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherFocusRing class="inline-flex gap-2 p-1">
      <button type="button">First</button>
      <button type="button">Second</button>
    </DitherFocusRing>
  )
}

export const meta = defineExample({
  component: DitherFocusRing,
  title: "Focus ring",
  studio: { group: "structure", frame: { w: 240, h: 90 }, controls: {}, slot: "Focus the control" },
})
