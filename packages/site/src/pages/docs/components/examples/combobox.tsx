import { createSignal } from "solid-js"
import { DitherCombobox, type PixelColor } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [swatch, setSwatch] = createSignal("blue")
  const COLORS = ["green", "blue", "purple", "pink", "orange", "red", "grey"].map((c) => ({ value: c, label: c }))

  return (
    <div class="mx-auto max-w-sm">
      <DitherCombobox
        modelValue={swatch()}
        onUpdateModelValue={setSwatch}
        options={COLORS}
        color={swatch() as PixelColor}
      />
      <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">swatch: "{swatch()}"</p>
    </div>
  )
}

export const meta = defineExample({
  component: DitherCombobox,
  title: "Combobox",
  studio: {
    group: "inputs",
    frame: { w: 280, h: 220 },
    model: { demo: "" },
    controls: {
      color: {},
      options: { kind: "list", demo: ["Kyoto", "Seoul", "Taipei"] },
      placeholder: { demo: "Search…" },
      disabled: {},
    },
  },
})
