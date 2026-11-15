import { DitherColorSwatch } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherColorSwatch label="Iris" />
}

export const meta = defineExample({
  component: DitherColorSwatch,
  title: "Color swatch",
  studio: {
    group: "inputs",
    frame: { w: 220, h: 90 },
    controls: { color: {}, label: {}, selected: {}, size: { min: 12, max: 64 }, disabled: {} },
  },
  states: [{ color: "#3DA5FF" }],
})
