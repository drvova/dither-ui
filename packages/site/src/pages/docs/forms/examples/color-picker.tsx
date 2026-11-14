import { createSignal } from "solid-js"
import { DitherColorPicker } from "@dither-kit"

export default function Example() {
  const [tint, setTint] = createSignal("#5227FF")

  return <DitherColorPicker modelValue={tint()} onUpdateModelValue={setTint} />
}
