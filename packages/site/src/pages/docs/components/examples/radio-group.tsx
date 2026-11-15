import { createSignal } from "solid-js"
import { DitherRadioGroup } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

const BLOOMS = [
  { value: "off", label: "Off" },
  { value: "low", label: "Low" },
  { value: "high", label: "High" },
]

export default function Example() {
  const [bloom, setBloom] = createSignal("low")

  return <DitherRadioGroup label="Bloom level" modelValue={bloom()} onUpdateModelValue={setBloom} options={BLOOMS} />
}

export const meta = defineExample({
  component: DitherRadioGroup,
  title: "Radio group",
  studio: {
    group: "inputs",
    frame: { w: 260, h: 160 },
    controls: { color: {}, label: { demo: "Choose one" }, options: { kind: "list", demo: ["One", "Two", "Three"] } },
    model: { demo: "one" },
  },
})
