import { createSignal } from "solid-js"
import { DitherDatePicker } from "@dither-kit"

export default function Example() {
  const [due, setDue] = createSignal("2026-10-07")

  return <DitherDatePicker modelValue={due()} onUpdateModelValue={setDue} min="2026-01-01" />
}
