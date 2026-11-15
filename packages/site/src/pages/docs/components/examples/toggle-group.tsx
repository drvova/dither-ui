import { createSignal } from "solid-js"
import { DitherToggleGroup } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

const STYLES = [
  { value: "bold", label: "Bold" },
  { value: "italic", label: "Italic" },
  { value: "underline", label: "Underline" },
]

export default function Example() {
  const [style, setStyle] = createSignal<string | string[]>("bold")

  return <DitherToggleGroup modelValue={style()} onUpdateModelValue={setStyle} options={STYLES} />
}

export const meta = defineExample({
  component: DitherToggleGroup,
  title: "Toggle group",
  studio: {
    group: "inputs",
    frame: { w: 300, h: 100 },
    controls: { color: {}, type: {}, options: { kind: "list", demo: ["Bold", "Italic", "Underline"] } },
  },
})
