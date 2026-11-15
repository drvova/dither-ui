import { createSignal } from "solid-js"
import { DitherField, DitherScrubInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [opacity, setOpacity] = createSignal(64)

  return (
    <DitherField label="Opacity" description="Drag the grip, or focus it and use the arrows">
      <DitherScrubInput modelValue={opacity()} onUpdateModelValue={setOpacity} min={0} max={100} step={1} />
    </DitherField>
  )
}

export const meta = defineExample({
  component: DitherScrubInput,
  title: "Scrub input",
  studio: {
    group: "inputs",
    frame: { w: 280, h: 90 },
    controls: {
      min: { min: -100, max: 100 },
      max: { min: 0, max: 1000 },
      step: { min: 0.1, max: 50, step: 0.1 },
      disabled: {},
    },
  },
})
