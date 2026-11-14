import { createSignal } from "solid-js"
import { DitherField, DitherHotkeyInput } from "@dither-kit"

export default function Example() {
  const [binding, setBinding] = createSignal("Ctrl+Shift+K")

  return (
    <DitherField label="Command palette" description="Click the field, then press the combo">
      <DitherHotkeyInput modelValue={binding()} onUpdateModelValue={setBinding} />
    </DitherField>
  )
}
