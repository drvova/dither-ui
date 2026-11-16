import { createSignal } from "solid-js"
import { DitherField, DitherFieldset, DitherInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [name, setName] = createSignal("Ada Byte")
  const [handle, setHandle] = createSignal("ada")

  return (
    <DitherFieldset legend="Profile">
      <DitherField label="Name" for="profile-name">
        <DitherInput id="profile-name" modelValue={name()} onUpdateModelValue={setName} />
      </DitherField>
      <DitherField label="Handle" for="profile-handle">
        <DitherInput id="profile-handle" modelValue={handle()} onUpdateModelValue={setHandle} />
      </DitherField>
    </DitherFieldset>
  )
}

export const meta = defineExample({
  component: DitherFieldset,
  title: "Fieldset",
  studio: { group: "structure", frame: { w: 340, h: 190 }, controls: { legend: { demo: "Account" } } },
})
