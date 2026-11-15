import { createSignal } from "solid-js"
import { DitherDatePicker } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [due, setDue] = createSignal("2026-10-07")

  return <DitherDatePicker modelValue={due()} onUpdateModelValue={setDue} min="2026-01-01" />
}

export const meta = defineExample({
  component: DitherDatePicker,
  title: "Date picker",
  studio: {
    group: "inputs",
    frame: { w: 280, h: 300 },
    controls: { placeholder: {}, min: { demo: "" }, max: { demo: "" }, disabled: {} },
  },
  states: [{ min: "2026-10-01", max: "2026-10-31" }],
})
