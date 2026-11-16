import { createSignal } from "solid-js"
import { DitherField, DitherHotkeyInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [binding, setBinding] = createSignal("Ctrl+Shift+K")

  return (
    <DitherField label="Command palette" description="Click the field, then press the combo">
      <DitherHotkeyInput modelValue={binding()} onUpdateModelValue={setBinding} />
    </DitherField>
  )
}

export const meta = defineExample({
  component: DitherHotkeyInput,
  title: "Hotkey input",
  studio: { group: "inputs", frame: { w: 280, h: 90 }, controls: { placeholder: {}, disabled: { demo: false } } },
})
