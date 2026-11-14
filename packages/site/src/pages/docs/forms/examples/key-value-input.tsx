import { createSignal } from "solid-js"
import { DitherKeyValueInput } from "@dither-kit"

export default function Example() {
  const [headers, setHeaders] = createSignal([
    { key: "Content-Type", value: "application/json" },
    { key: "X-Client", value: "dither-ui" },
  ])

  return <DitherKeyValueInput modelValue={headers()} onUpdateModelValue={setHeaders} />
}
