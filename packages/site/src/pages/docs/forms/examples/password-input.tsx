import { createSignal } from "solid-js"
import { DitherField, DitherPasswordInput } from "@dither-kit"

export default function Example() {
  const [pw, setPw] = createSignal("correct-horse-battery")

  return (
    <DitherField label="Password">
      <DitherPasswordInput modelValue={pw()} onUpdateModelValue={setPw} placeholder="At least 12 characters" />
    </DitherField>
  )
}
