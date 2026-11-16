import { createSignal } from "solid-js"
import { DitherField, DitherPasswordInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [pw, setPw] = createSignal("correct-horse-battery")

  return (
    <DitherField label="Password">
      <DitherPasswordInput modelValue={pw()} onUpdateModelValue={setPw} placeholder="At least 12 characters" />
    </DitherField>
  )
}

export const meta = defineExample({
  component: DitherPasswordInput,
  title: "Password",
  studio: {
    group: "inputs",
    frame: { w: 280, h: 90 },
    controls: { placeholder: {}, invalid: {}, disabled: { demo: false } },
    model: { demo: "correct-horse" },
    field: true,
  },
})
