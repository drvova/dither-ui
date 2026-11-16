import { createSignal } from "solid-js"
import { DitherField, DitherTextarea } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [bio, setBio] = createSignal("Dithered interfaces, composed with Solid.")

  return (
    <DitherField label="Bio" description="A short introduction.">
      <DitherTextarea modelValue={bio()} onUpdateModelValue={setBio} placeholder="Tell us what you make…" />
    </DitherField>
  )
}

export const meta = defineExample({
  component: DitherTextarea,
  title: "Textarea",
  studio: {
    group: "inputs",
    frame: { w: 300, h: 150 },
    model: { demo: "" },
    controls: {
      placeholder: { demo: "Write a note…" },
      rows: { min: 2, max: 12 },
      resize: { options: ["none", "vertical", "horizontal", "both"] },
      invalid: {},
      disabled: {},
    },
    field: true,
  },
})
