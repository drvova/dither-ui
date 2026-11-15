import { createSignal } from "solid-js"
import { DitherColorPicker } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [tint, setTint] = createSignal("#5227FF")

  return <DitherColorPicker modelValue={tint()} onUpdateModelValue={setTint} />
}

export const meta = defineExample({
  component: DitherColorPicker,
  title: "Color picker",
  studio: { group: "inputs", frame: { w: 260, h: 270 }, controls: { disabled: {} } },
})
