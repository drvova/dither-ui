import { createSignal } from "solid-js"
import { DitherCheckboxCard } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [telemetry, setTelemetry] = createSignal(true)

  return (
    <DitherCheckboxCard
      modelValue={telemetry()}
      onUpdateModelValue={setTelemetry}
      label="Telemetry"
      description="Anonymous usage stats help pick the next components"
    />
  )
}

export const meta = defineExample({
  component: DitherCheckboxCard,
  title: "Checkbox card",
  studio: {
    group: "inputs",
    frame: { w: 300, h: 120 },
    controls: { label: {}, description: { demo: "Anonymous usage stats" }, disabled: {} },
  },
})
