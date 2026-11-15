import { createSignal } from "solid-js"
import { DitherMonthPicker } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [month, setMonth] = createSignal("2026-10")

  return <DitherMonthPicker modelValue={month()} onUpdateModelValue={setMonth} />
}

export const meta = defineExample({
  component: DitherMonthPicker,
  title: "Month picker",
  studio: { group: "inputs", frame: { w: 240, h: 180 }, controls: { disabled: {} } },
})
