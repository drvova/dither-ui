import { createSignal } from "solid-js"
import { DitherCheckboxGroup } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

const PARTS = [
  { value: "grid", label: "Grid" },
  { value: "legend", label: "Legend" },
  { value: "tooltip", label: "Tooltip" },
]

export default function Example() {
  const [parts, setParts] = createSignal(["grid", "legend"])

  return <DitherCheckboxGroup label="Chart parts" modelValue={parts()} onUpdateModelValue={setParts} options={PARTS} />
}

export const meta = defineExample({
  component: DitherCheckboxGroup,
  title: "Checkbox group",
  studio: {
    group: "inputs",
    frame: { w: 260, h: 170 },
    controls: { color: {}, label: { demo: "Choose any" }, options: { kind: "list", demo: ["One", "Two", "Three"] } },
    model: { demo: ["one"] },
  },
})
