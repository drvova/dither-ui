import { createSignal } from "solid-js"
import { DitherFontPicker } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [font, setFont] = createSignal("'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace")

  return <DitherFontPicker modelValue={font()} onUpdateModelValue={setFont} />
}

export const meta = defineExample({
  component: DitherFontPicker,
  title: "Font picker",
  studio: {
    group: "inputs",
    frame: { w: 300, h: 300 },
    controls: { disabled: {} },
    model: { demo: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  },
})
