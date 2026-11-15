import { createSignal } from "solid-js"
import { DitherField, DitherTextarea } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [note, setNote] = createSignal("")

  return (
    <DitherField label="Note">
      <DitherTextarea placeholder="Write a note…" modelValue={note()} onUpdateModelValue={setNote} />
    </DitherField>
  )
}

export const meta = defineExample({
  component: DitherTextarea,
  title: "Textarea",
  studio: {
    group: "inputs",
    frame: { w: 300, h: 150 },
    controls: {
      placeholder: {},
      rows: { min: 2, max: 12 },
      resize: { options: ["none", "vertical", "horizontal", "both"] },
      invalid: {},
      disabled: {},
    },
    field: true,
  },
})
