import { createSignal } from "solid-js"
import { DitherField, DitherSelect } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

const CHARTS = [
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar" },
  { value: "area", label: "Area" },
]

export default function Example() {
  const [chart, setChart] = createSignal("")

  return (
    <DitherField label="Chart type">
      <DitherSelect modelValue={chart()} onUpdateModelValue={setChart} options={CHARTS} />
    </DitherField>
  )
}

export const meta = defineExample({
  component: DitherSelect,
  title: "Select",
  studio: {
    group: "inputs",
    frame: { w: 280, h: 220 },
    controls: {
      color: {},
      options: { kind: "list", demo: ["One", "Two", "Three"] },
      placeholder: {},
      invalid: {},
      disabled: {},
    },
    field: true,
  },
})
