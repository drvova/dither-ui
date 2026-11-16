import { createSignal } from "solid-js"
import { DitherPhoneInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [phone, setPhone] = createSignal("(415) 555-2671")

  return <DitherPhoneInput modelValue={phone()} onUpdateModelValue={setPhone} />
}

export const meta = defineExample({
  component: DitherPhoneInput,
  title: "Phone",
  studio: {
    group: "inputs",
    frame: { w: 280, h: 90 },
    controls: { placeholder: {}, autocomplete: {}, disabled: { demo: false } },
    field: true,
  },
})
