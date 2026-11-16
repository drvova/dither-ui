import { createSignal } from "solid-js"
import { DitherKeyValueInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [headers, setHeaders] = createSignal([
    { key: "Content-Type", value: "application/json" },
    { key: "X-Client", value: "dither-ui" },
  ])

  return <DitherKeyValueInput modelValue={headers()} onUpdateModelValue={setHeaders} />
}

export const meta = defineExample({
  component: DitherKeyValueInput,
  title: "Key/value input",
  studio: {
    group: "inputs",
    frame: { w: 360, h: 130 },
    controls: { disabled: {} },
    model: { demo: [{ key: "Content-Type", value: "application/json" }] },
  },
})
