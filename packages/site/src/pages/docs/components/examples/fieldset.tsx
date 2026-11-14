import { createSignal } from "solid-js"
import { DitherField, DitherFieldset, DitherInput } from "@dither-kit"

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
