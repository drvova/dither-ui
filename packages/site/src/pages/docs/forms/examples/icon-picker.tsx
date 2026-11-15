import { createSignal } from "solid-js"
import { DitherIconPicker } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [glyph, setGlyph] = createSignal("Check")

  return <DitherIconPicker modelValue={glyph()} onUpdateModelValue={setGlyph} />
}

export const meta = defineExample({
  component: DitherIconPicker,
  title: "Icon picker",
  studio: {
    group: "inputs",
    frame: { w: 300, h: 200 },
    controls: { size: { min: 8, max: 32 }, placeholder: {}, disabled: {} },
  },
})
