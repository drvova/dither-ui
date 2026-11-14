import { createSignal } from "solid-js"
import { DitherMonthPicker } from "@dither-kit"

export default function Example() {
  const [month, setMonth] = createSignal("2026-10")

  return <DitherMonthPicker modelValue={month()} onUpdateModelValue={setMonth} />
}
