import { createSignal } from "solid-js"
import { DitherKnob } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [gain, setGain] = createSignal(64)

  return <DitherKnob modelValue={gain()} onUpdateModelValue={setGain} min={0} max={100} step={1} />
}

export const meta = defineExample({
  component: DitherKnob,
  title: "Knob",
  studio: {
    group: "inputs",
    frame: { w: 240, h: 140 },
    controls: {
      min: { min: -100, max: 100 },
      max: { min: 0, max: 1000 },
      step: { min: 0.1, max: 50, step: 0.1 },
      size: { min: 40, max: 128 },
      disabled: {},
    },
  },
})
