import { createSignal } from "solid-js"
import { DitherEmailInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [email, setEmail] = createSignal("")

  return <DitherEmailInput modelValue={email()} onUpdateModelValue={setEmail} />
}

export const meta = defineExample({
  component: DitherEmailInput,
  title: "Email",
  studio: {
    group: "inputs",
    frame: { w: 280, h: 90 },
    controls: { placeholder: {}, autocomplete: {}, invalid: { demo: false }, disabled: { demo: false } },
    model: { demo: "a@b.co" },
    field: true,
  },
})
