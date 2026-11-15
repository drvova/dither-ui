import { DitherFocusScope } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherFocusScope class="flex gap-2">
      <button type="button">Yes</button>
      <button type="button">No</button>
    </DitherFocusScope>
  )
}

export const meta = defineExample({
  component: DitherFocusScope,
  title: "Focus scope",
  studio: {
    group: "structure",
    frame: { w: 260, h: 130 },
    controls: { autofocus: { demo: false }, trapped: { demo: false }, restoreFocus: { demo: false } },
    slot: "Scoped content",
  },
})
