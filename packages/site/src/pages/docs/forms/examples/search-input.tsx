import { createSignal } from "solid-js"
import { DitherField, DitherSearchInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [query, setQuery] = createSignal("dither")

  return (
    <DitherField label="Search">
      <DitherSearchInput placeholder="Search…" modelValue={query()} onUpdateModelValue={setQuery} />
    </DitherField>
  )
}

export const meta = defineExample({
  component: DitherSearchInput,
  title: "Search",
  studio: {
    group: "inputs",
    frame: { w: 280, h: 90 },
    controls: { placeholder: {}, disabled: { demo: false } },
    field: true,
  },
})
