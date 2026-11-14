import { createSignal } from "solid-js"
import { DitherCheckboxCard } from "@dither-kit"

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
