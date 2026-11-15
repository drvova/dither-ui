import { createSignal } from "solid-js"
import { DitherAutocomplete } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [query, setQuery] = createSignal("")

  return (
    <DitherAutocomplete
      suggestions={["Area chart", "Avatar", "Button"]}
      modelValue={query()}
      onUpdateModelValue={setQuery}
    />
  )
}

export const meta = defineExample({
  component: DitherAutocomplete,
  title: "Autocomplete",
  studio: { group: "inputs", frame: { w: 280, h: 220 }, controls: { suggestions: {}, placeholder: {}, disabled: {} } },
})
