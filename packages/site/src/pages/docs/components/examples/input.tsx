import { createSignal } from "solid-js"
import { DitherField, DitherInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [name, setName] = createSignal("")

  return (
    <DitherField label="Name">
      <DitherInput placeholder="Type here…" modelValue={name()} onUpdateModelValue={setName} />
    </DitherField>
  )
}

export const meta = defineExample({
  component: DitherInput,
  title: "Input",
  studio: {
    group: "inputs",
    frame: { w: 280, h: 90 },
    controls: { placeholder: {}, invalid: {}, disabled: {} },
    field: true,
  },
})
