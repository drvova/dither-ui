import { createSignal } from "solid-js"
import { DitherChoiceChips } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [size, setSize] = createSignal("M")
  const [labels, setLabels] = createSignal(["bug"])

  return (
    <>
      <DitherChoiceChips
        modelValue={size()}
        onUpdateModelValue={setSize}
        label="Size"
        options={["S", "M", "L", "XL"]}
      />
      <DitherChoiceChips
        modelValue={labels()}
        onUpdateModelValue={setLabels}
        multiple
        options={["bug", "feat", "docs"]}
      />
    </>
  )
}

export const meta = defineExample({
  component: DitherChoiceChips,
  title: "Choice chips",
  studio: {
    group: "inputs",
    frame: { w: 300, h: 90 },
    controls: { label: { demo: "" }, options: {}, multiple: {}, disabled: {} },
  },
})
