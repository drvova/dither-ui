import { createSignal } from "solid-js"
import { DitherListBox } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [city, setCity] = createSignal("Seoul")

  return (
    <DitherListBox
      value={city()}
      onUpdateModelValue={(next) => setCity(next)}
      options={["Kyoto", "Seoul", "Taipei", "Osaka", "Busan"]}
      aria-label="City"
    />
  )
}

export const meta = defineExample({
  component: DitherListBox,
  title: "List box",
  studio: {
    group: "inputs",
    frame: { w: 260, h: 160 },
    controls: { options: { demo: ["Kyoto", "Seoul", "Taipei"] }, disabled: {} },
    model: { prop: "value" },
  },
})
