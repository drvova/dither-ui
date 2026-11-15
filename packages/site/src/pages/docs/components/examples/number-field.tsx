import { createSignal } from "solid-js"
import { DitherNumberField } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [count, setCount] = createSignal(24)

  return <DitherNumberField min={0} max={100} modelValue={count()} onUpdateModelValue={setCount} />
}

export const meta = defineExample({
  component: DitherNumberField,
  title: "Number field",
  studio: {
    group: "inputs",
    frame: { w: 220, h: 90 },
    controls: { min: {}, max: {}, step: { min: 0.1, step: 0.1 }, disabled: {} },
  },
})
