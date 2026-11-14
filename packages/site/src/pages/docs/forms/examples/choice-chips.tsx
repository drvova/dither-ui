import { createSignal } from "solid-js"
import { DitherChoiceChips } from "@dither-kit"

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
