import { createSignal } from "solid-js"
import { DitherWheelPicker } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((label) => ({ value: label.toLowerCase(), label }))

export default function Example() {
  const [month, setMonth] = createSignal("jan")

  return <DitherWheelPicker label="Month" modelValue={month()} onUpdateModelValue={setMonth} options={MONTHS} />
}

export const meta = defineExample({
  component: DitherWheelPicker,
  title: "Wheel picker",
  studio: {
    group: "inputs",
    frame: { w: 200, h: 180 },
    controls: {
      color: {},
      options: { kind: "list", demo: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
      rows: { min: 3, max: 9, step: 2 },
      label: {},
    },
  },
})
