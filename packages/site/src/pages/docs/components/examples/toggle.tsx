import { createSignal } from "solid-js"
import { DitherToggle } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [bold, setBold] = createSignal(true)

  return (
    <DitherToggle modelValue={bold()} onUpdateModelValue={setBold}>
      Bold
    </DitherToggle>
  )
}

export const meta = defineExample({
  component: DitherToggle,
  title: "Toggle",
  studio: { group: "inputs", frame: { w: 160, h: 80 }, controls: { color: {}, disabled: {} } },
})
