import { createSignal } from "solid-js"
import { DitherCombobox } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

const CITIES = [
  { value: "kyoto", label: "Kyoto" },
  { value: "seoul", label: "Seoul" },
  { value: "taipei", label: "Taipei" },
]

export default function Example() {
  const [city, setCity] = createSignal("")

  return <DitherCombobox placeholder="Search…" modelValue={city()} onUpdateModelValue={setCity} options={CITIES} />
}

export const meta = defineExample({
  component: DitherCombobox,
  title: "Combobox",
  studio: {
    group: "inputs",
    frame: { w: 280, h: 220 },
    controls: {
      color: {},
      options: { kind: "list", demo: ["Kyoto", "Seoul", "Taipei"] },
      placeholder: {},
      disabled: {},
    },
  },
})
