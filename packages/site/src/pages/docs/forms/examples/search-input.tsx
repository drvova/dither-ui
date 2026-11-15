import { createSignal } from "solid-js"
import { DitherSearchInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [q, setQ] = createSignal("dither")

  return <DitherSearchInput modelValue={q()} onUpdateModelValue={setQ} />
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
