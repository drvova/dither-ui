import { createSignal } from "solid-js"
import { DitherCodeInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [snippet, setSnippet] = createSignal("const dither = bayer(4)")

  return <DitherCodeInput modelValue={snippet()} onUpdateModelValue={setSnippet} />
}

export const meta = defineExample({
  component: DitherCodeInput,
  title: "Code input",
  studio: {
    group: "inputs",
    frame: { w: 340, h: 170 },
    controls: { rows: { min: 2, max: 16 }, placeholder: {}, disabled: { demo: false } },
  },
})
