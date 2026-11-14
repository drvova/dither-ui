import { createSignal } from "solid-js"
import { DitherField, DitherScrubInput } from "@dither-kit"

export default function Example() {
  const [opacity, setOpacity] = createSignal(64)

  return (
    <DitherField label="Opacity" description="Drag the grip, or focus it and use the arrows">
      <DitherScrubInput modelValue={opacity()} onUpdateModelValue={setOpacity} min={0} max={100} step={1} />
    </DitherField>
  )
}
