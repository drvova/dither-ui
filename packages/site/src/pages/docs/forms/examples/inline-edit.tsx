import { createSignal } from "solid-js"
import { DitherField, DitherInlineEdit } from "@dither-kit"

export default function Example() {
  const [name, setName] = createSignal("bogdan")

  function persist(next: string) {
    localStorage.setItem("display-name", next)
  }

  return (
    <DitherField label="Display name" description="Click the value to edit it">
      <DitherInlineEdit modelValue={name()} onUpdateModelValue={setName} onSave={persist} />
    </DitherField>
  )
}
