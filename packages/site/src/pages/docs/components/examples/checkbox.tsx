import { createSignal } from "solid-js"
import { DitherCheckbox } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [remember, setRemember] = createSignal(true)

  return (
    <DitherCheckbox modelValue={remember()} onUpdateModelValue={setRemember}>
      Remember me
    </DitherCheckbox>
  )
}

export const meta = defineExample({
  component: DitherCheckbox,
  title: "Checkbox",
  studio: { group: "inputs", frame: { w: 180, h: 80 }, controls: { color: {}, disabled: {} } },
})
