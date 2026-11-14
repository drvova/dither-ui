import { createSignal } from "solid-js"
import { DitherKnob } from "@dither-kit"

export default function Example() {
  const [gain, setGain] = createSignal(64)

  return <DitherKnob modelValue={gain()} onUpdateModelValue={setGain} min={0} max={100} step={1} />
}
