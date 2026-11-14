import { createSignal } from "solid-js"
import { DitherIconPicker } from "@dither-kit"

export default function Example() {
  const [glyph, setGlyph] = createSignal("Check")

  return <DitherIconPicker modelValue={glyph()} onUpdateModelValue={setGlyph} />
}
