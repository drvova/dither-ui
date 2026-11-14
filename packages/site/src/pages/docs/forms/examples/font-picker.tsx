import { createSignal } from "solid-js"
import { DitherFontPicker } from "@dither-kit"

export default function Example() {
  const [font, setFont] = createSignal("'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace")

  return <DitherFontPicker modelValue={font()} onUpdateModelValue={setFont} />
}
